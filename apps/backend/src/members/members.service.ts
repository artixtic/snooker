import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async create(createMemberDto: CreateMemberDto) {
    return this.prisma.member.create({
      data: createMemberDto,
    });
  }

  async findAll(search?: string, isActive?: boolean) {
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { memberNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sales: true,
            bookings: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return member;
  }

  async findByMemberNumber(memberNumber: string) {
    return this.prisma.member.findUnique({
      where: { memberNumber },
    });
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    const member = await this.findOne(id);
    
    return this.prisma.member.update({
      where: { id },
      data: updateMemberDto,
    });
  }

  async remove(id: string) {
    const member = await this.findOne(id);
    
    return this.prisma.member.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getCreditBalance(id: string) {
    const member = await this.findOne(id);
    return {
      balance: member.balance,
      creditLimit: member.creditLimit,
      availableCredit: Number(member.creditLimit) - Number(member.balance),
    };
  }
}

