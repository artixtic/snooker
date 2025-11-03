import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto, employeeId: string) {
    // Generate receipt number
    const receiptNumber = await this.generateReceiptNumber();

    // Create sale with items (append-only, no updates)
    return this.prisma.sale.create({
      data: {
        ...createSaleDto,
        receiptNumber,
        employeeId,
        items: {
          create: createSaleDto.items.map((item) => ({
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
      },
    });
  }

  async findAll(filters?: { startDate?: Date; endDate?: Date; employeeId?: string }) {
    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
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

