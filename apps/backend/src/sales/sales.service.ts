import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto, employeeId: string) {
    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Generate receipt number first
      const receiptNumber = await this.generateReceiptNumber(tx);

      // Validate stock availability for all items
      if (createSaleDto.items && createSaleDto.items.length > 0) {
        for (const item of createSaleDto.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundException(`Product with ID ${item.productId} not found`);
          }

          if (product.deleted) {
            throw new BadRequestException(`Product ${product.name} has been deleted`);
          }

          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
            );
          }
        }

        // Update stock and create inventory movements
        for (const item of createSaleDto.items) {
          // Decrement stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          // Create inventory movement record
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              change: -item.quantity, // Negative for sale
              reason: `Sale - Receipt ${receiptNumber}`,
              userId: employeeId,
            },
          });
        }
      }

      // Create sale with items
      const saleData: any = {
        ...createSaleDto,
        receiptNumber,
        employeeId,
        items: {
          create: (createSaleDto.items || []).map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount !== undefined ? item.discount : null,
            tax: item.tax !== undefined ? item.tax : null,
            subtotal: item.subtotal,
            notes: item.notes,
          })),
        },
      };
      
      // Handle optional tax field - set to 0 if undefined (until migration makes it nullable)
      // TODO: After migration, change this to null or omit the field
      if (createSaleDto.tax !== undefined && createSaleDto.tax !== null) {
        saleData.tax = createSaleDto.tax;
      } else {
        saleData.tax = 0; // Temporary: set to 0 until database migration is applied
      }
      
      const sale = await tx.sale.create({
        data: saleData,
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
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  private async generateReceiptNumber(tx?: any): Promise<string> {
    const prisma = tx || this.prisma;
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.sale.count({
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

