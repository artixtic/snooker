import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createMovement(dto: CreateInventoryMovementDto, userId: string) {
    // Create movement and update stock in transaction
    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: dto.productId,
          change: dto.change,
          reason: dto.reason,
          userId,
        },
      });

      await tx.product.update({
        where: { id: dto.productId },
        data: {
          stock: { increment: dto.change },
        },
      });

      return movement;
    });
  }

  async findAllMovements(productId?: string) {
    const where: any = {};
    if (productId) {
      where.productId = productId;
    }

    return this.prisma.inventoryMovement.findMany({
      where,
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLowStockProducts(threshold: number = 10) {
    return this.prisma.product.findMany({
      where: {
        stock: { lte: threshold },
        deleted: false,
      },
      orderBy: { stock: 'asc' },
    });
  }
}

