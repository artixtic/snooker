import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findFirst({
      where: { 
        username,
        deleted: false 
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    // Check if user exists and is not deleted
    if (!user || user.deleted) {
      return null;
    }
    
    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { deleted: false },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if username is being updated and if it's already taken by another user
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: updateUserDto.username,
          deleted: false,
          NOT: { id },
        },
      });
      if (existingUser) {
        throw new ConflictException(`Username "${updateUserDto.username}" is already taken`);
      }
    }

    const data: any = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: { deleted: true },
    });
  }
}

