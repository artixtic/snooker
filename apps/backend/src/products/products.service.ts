import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(since?: string) {
    const where: any = { deleted: false };
    if (since) {
      where.updatedAt = { gte: new Date(since) };
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deleted: false },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findByBarcode(barcode: string) {
    return this.prisma.product.findUnique({
      where: { barcode, deleted: false },
    });
  }

  async create(createProductDto: CreateProductDto, userId?: string) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        lastModifiedBy: userId,
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId?: string) {
    const product = await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        version: product.version + 1,
        lastModifiedBy: userId,
      },
    });
  }

  async remove(id: string) {
    // Soft delete
    return this.prisma.product.update({
      where: { id },
      data: { deleted: true },
    });
  }
}

