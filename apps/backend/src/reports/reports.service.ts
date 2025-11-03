import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDailyReport(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
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

    // Table usage
    const tableSessions = await this.prisma.tableSession.findMany({
      where: {
        startedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return {
      date: date.toISOString().split('T')[0],
      totalSales,
      totalCash,
      totalCard,
      saleCount: sales.length,
      topProducts,
      tableSessions: tableSessions.length,
      averageSaleValue: sales.length > 0 ? totalSales / sales.length : 0,
    };
  }
}

