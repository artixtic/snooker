import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto, employeeId: string) {
    // Generate receipt number
    const receiptNumber = await this.generateReceiptNumber();

    // If credit payment, validate member and credit limit
    if (createSaleDto.paymentMethod === 'CREDIT') {
      if (!createSaleDto.memberId) {
        throw new NotFoundException('Member ID is required for credit payments');
      }

      const member = await this.prisma.member.findUnique({
        where: { id: createSaleDto.memberId },
      });

      if (!member) {
        throw new NotFoundException(`Member with ID ${createSaleDto.memberId} not found`);
      }

      const newBalance = Number(member.balance) + createSaleDto.total;
      if (newBalance > Number(member.creditLimit)) {
        throw new Error(
          `Credit limit exceeded. Available credit: ${Number(member.creditLimit) - Number(member.balance)}`,
        );
      }
    }

    // Create sale with items and credit transaction if needed
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          ...createSaleDto,
          receiptNumber,
          employeeId,
          items: {
            create: (createSaleDto.items || []).map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              tax: item.tax,
              subtotal: item.subtotal,
              notes: item.notes,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          table: true,
          member: true,
        },
      });

      // Create credit transaction if payment is credit
      if (createSaleDto.paymentMethod === 'CREDIT' && createSaleDto.memberId) {
        const member = await tx.member.findUnique({
          where: { id: createSaleDto.memberId },
        });

        if (member) {
          const balanceBefore = Number(member.balance);
          const balanceAfter = balanceBefore + createSaleDto.total;

          await tx.creditTransaction.create({
            data: {
              memberId: createSaleDto.memberId,
              saleId: sale.id,
              type: 'SALE',
              amount: createSaleDto.total,
              balanceBefore,
              balanceAfter,
              description: `Sale ${receiptNumber}`,
              employeeId,
            },
          });

          await tx.member.update({
            where: { id: createSaleDto.memberId },
            data: { balance: balanceAfter },
          });
        }
      }

      return sale;
    });
  }

  async findAll(filters?: { startDate?: Date; endDate?: Date; employeeId?: string; tableId?: string }) {
    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters?.tableId) {
      where.tableId = filters.tableId;
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
          },
        },
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        table: true,
        member: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  private async generateReceiptNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.sale.count({
      where: {
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });
    return `RCP-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
}

