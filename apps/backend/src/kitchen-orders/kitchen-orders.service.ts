import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKitchenOrderDto } from './dto/create-kitchen-order.dto';
import { KitchenOrderStatus } from '@prisma/client';

@Injectable()
export class KitchenOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createKitchenOrderDto: CreateKitchenOrderDto) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: createKitchenOrderDto.saleId },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${createKitchenOrderDto.saleId} not found`);
    }

    let items;
    try {
      items = JSON.parse(createKitchenOrderDto.items);
    } catch {
      throw new Error('Invalid items JSON format');
    }

    return this.prisma.kitchenOrder.create({
      data: {
        saleId: createKitchenOrderDto.saleId,
        items,
        notes: createKitchenOrderDto.notes,
        estimatedTime: createKitchenOrderDto.estimatedTime,
        status: 'PENDING',
      },
    });
  }

  async findAll(status?: KitchenOrderStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.kitchenOrder.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.kitchenOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Kitchen order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(id: string, status: KitchenOrderStatus) {
    const order = await this.findOne(id);
    const updateData: any = { status };

    if (status === 'PREPARING' && !order.startedAt) {
      updateData.startedAt = new Date();
    } else if (status === 'READY' && !order.readyAt) {
      updateData.readyAt = new Date();
    } else if (status === 'SERVED' && !order.servedAt) {
      updateData.servedAt = new Date();
    }

    return this.prisma.kitchenOrder.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.kitchenOrder.delete({ where: { id } });
  }
}

