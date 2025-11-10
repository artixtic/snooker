import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartShiftDto } from './dto/start-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.shift.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findActive(employeeId: string) {
    return this.prisma.shift.findFirst({
      where: {
        employeeId,
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({
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

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    return shift;
  }

  async start(employeeId: string, dto: StartShiftDto) {
    // Check if there's an active shift
    const activeShift = await this.findActive(employeeId);
    if (activeShift) {
      throw new Error('Employee already has an active shift');
    }

    return this.prisma.shift.create({
      data: {
        employeeId,
        openingCash: dto.openingCash,
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getShiftReport(id: string) {
    const shift = await this.findOne(id);
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    const endTime = shift.endedAt || new Date();
    
    // Get all sales for this shift period (all sales during the shift, regardless of employee)
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: shift.startedAt,
          lte: endTime,
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
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate canteen sales (from sale items) and snooker sales (table charges)
    let canteenTotal = 0;
    let snookerTotal = 0;
    
    sales.forEach((sale) => {
      // Calculate canteen total from items (subtotal + tax for each item)
      const saleCanteenTotal = sale.items.reduce(
        (sum, item) => sum + Number(item.subtotal) + Number(item.tax || 0),
        0
      );
      canteenTotal += saleCanteenTotal;
      
      // Snooker total is the table charge portion (sale subtotal minus canteen items subtotal before tax)
      const canteenItemsSubtotal = sale.items.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0
      );
      const tableCharge = Number(sale.subtotal) - canteenItemsSubtotal;
      snookerTotal += tableCharge;
    });
    
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalCash = sales
      .filter((s) => s.paymentMethod === 'CASH' || s.paymentMethod === 'MIXED')
      .reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalCard = sales
      .filter((s) => s.paymentMethod === 'CARD')
      .reduce((sum, sale) => sum + Number(sale.total), 0);

    // Top products
    const productSales: Record<string, { product: any; quantity: number; revenue: number }> = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += Number(item.subtotal);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Table sessions for this shift
    const tableSessions = await this.prisma.tableSession.findMany({
      where: {
        startedAt: {
          gte: shift.startedAt,
          lte: endTime,
        },
      },
    });

    // Calculate expenses for the shift period
    const expenses = await this.prisma.expense.findMany({
      where: {
        date: {
          gte: shift.startedAt,
          lte: endTime,
        },
      },
    });
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    return {
      shiftId: shift.id,
      employee: shift.employee,
      startedAt: shift.startedAt,
      endedAt: shift.endedAt,
      openingCash: shift.openingCash,
      closingCash: shift.closingCash,
      salesTotal: totalSales,
      snookerTotal,
      canteenTotal,
      totalExpenses,
      totalCash,
      totalCard,
      saleCount: sales.length,
      topProducts,
      tableSessions: tableSessions.length,
      averageSaleValue: sales.length > 0 ? totalSales / sales.length : 0,
    };
  }

  async close(id: string, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    if (shift.status === 'CLOSED') {
      throw new Error('Shift is already closed');
    }

    // Calculate sales total for this shift period (all sales during the shift, regardless of employee)
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: shift.startedAt,
          lte: new Date(),
        },
      },
    });

    const salesTotal = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const cashDiscrepancy = Number(dto.closingCash) - (Number(shift.openingCash) + salesTotal);

    return this.prisma.shift.update({
      where: { id },
      data: {
        status: 'CLOSED',
        endedAt: new Date(),
        closingCash: dto.closingCash,
        salesTotal,
        cashDiscrepancy,
        notes: dto.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}

