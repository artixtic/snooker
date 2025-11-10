import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, employeeId: string) {
    return this.prisma.expense.create({
      data: {
        ...createExpenseDto,
        date: createExpenseDto.date ? new Date(createExpenseDto.date) : new Date(),
        employeeId,
      },
    });
  }

  async findAll(startDate?: string, endDate?: string, category?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (category) {
      where.category = category;
    }

    return this.prisma.expense.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    await this.findOne(id);

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...updateExpenseDto,
        date: updateExpenseDto.date ? new Date(updateExpenseDto.date) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getProfitLoss(startDate: string, endDate: string) {
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        total: true,
        subtotal: true,
        tax: true,
        discount: true,
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        amount: true,
        category: true,
      },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const profit = totalRevenue - totalExpenses;

    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      period: { startDate, endDate },
      revenue: {
        total: totalRevenue,
        sales: sales.length,
        averageSale: sales.length > 0 ? totalRevenue / sales.length : 0,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
      },
      profit: {
        total: profit,
        margin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
      },
    };
  }
}

