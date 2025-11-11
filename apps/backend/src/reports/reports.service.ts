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
        table: {
          include: {
            game: true,
          },
        },
      },
    });

    // Calculate totals by game
    const gameTotals: Record<string, { gameName: string; total: number; tableSessions: number }> = {};
    let canteenTotal = 0;
    
    sales.forEach((sale) => {
      // Calculate canteen total from items (subtotal + tax for each item)
      const saleCanteenTotal = sale.items.reduce(
        (sum, item) => sum + Number(item.subtotal) + Number(item.tax || 0),
        0
      );
      canteenTotal += saleCanteenTotal;
      
      // Calculate table charge per game
      if (sale.table && sale.table.game) {
        const gameId = sale.table.game.id;
        const gameName = sale.table.game.name;
        
        if (!gameTotals[gameId]) {
          gameTotals[gameId] = {
            gameName,
            total: 0,
            tableSessions: 0,
          };
        }
        
        // Table charge is the sale subtotal minus canteen items subtotal before tax
        const canteenItemsSubtotal = sale.items.reduce(
          (sum, item) => sum + Number(item.subtotal),
          0
        );
        const tableCharge = Number(sale.subtotal) - canteenItemsSubtotal;
        gameTotals[gameId].total += tableCharge;
      }
    });
    
    // Count table sessions per game
    const tableSessions = await this.prisma.tableSession.findMany({
      where: {
        startedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        game: true,
      },
    });
    
    // Count sessions per game
    tableSessions.forEach((session) => {
      if (session.game) {
        const gameId = session.game.id;
        if (gameTotals[gameId]) {
          gameTotals[gameId].tableSessions += 1;
        } else {
          gameTotals[gameId] = {
            gameName: session.game.name,
            total: 0,
            tableSessions: 1,
          };
        }
      }
    });
    
    // Calculate total game sales (sum of all game totals)
    const snookerTotal = Object.values(gameTotals).reduce((sum, game) => sum + game.total, 0);
    
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


    // Calculate expenses for the day
    const expenses = await this.prisma.expense.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    return {
      date: date.toISOString().split('T')[0],
      totalSales,
      snookerTotal,
      canteenTotal,
      gameTotals: Object.values(gameTotals),
      totalExpenses,
      totalCash,
      totalCard,
      saleCount: sales.length,
      topProducts,
      tableSessions: tableSessions.length,
      averageSaleValue: sales.length > 0 ? totalSales / sales.length : 0,
    };
  }
}

