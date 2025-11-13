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
    const gameTotals: Record<string, { gameName: string; total: number; tableSessions: number; tax: number; sessionsWithTax: number }> = {};
    let canteenTotal = 0;
    let canteenTax = 0;
    let canteenSalesWithTax = 0;
    
    sales.forEach((sale) => {
      // Calculate canteen total and tax from items
      let saleCanteenTax = 0;
      const saleCanteenSubtotal = sale.items.reduce(
        (sum, item) => {
          const itemTax = Number(item.tax || 0);
          saleCanteenTax += itemTax;
          return sum + Number(item.subtotal); // Only subtotal, tax is separate
        },
        0
      );
      // Canteen total should be WITHOUT tax (consistent with game totals)
      canteenTotal += saleCanteenSubtotal;
      canteenTax += saleCanteenTax;
      if (saleCanteenTax > 0) {
        canteenSalesWithTax += 1;
      }
      
      // Calculate table charge per game
      if (sale.table && sale.table.game) {
        const gameId = sale.table.game.id;
        const gameName = sale.table.game.name;
        
        if (!gameTotals[gameId]) {
          gameTotals[gameId] = {
            gameName,
            total: 0,
            tableSessions: 0,
            tax: 0,
            sessionsWithTax: 0,
          };
        }
        
        // Table charge is the sale subtotal minus canteen items subtotal before tax
        const canteenItemsSubtotal = sale.items.reduce(
          (sum, item) => sum + Number(item.subtotal),
          0
        );
        const tableCharge = Number(sale.subtotal) - canteenItemsSubtotal;
        gameTotals[gameId].total += tableCharge;
        
        // Calculate table tax: sale.tax contains both table tax + cart tax
        // So we need to subtract cart tax from sale.tax to get only table tax
        const totalSaleTax = Number(sale.tax || 0);
        const tableTax = totalSaleTax - saleCanteenTax; // Remove cart tax to get only table tax
        gameTotals[gameId].tax += Math.max(0, tableTax); // Ensure non-negative
        if (tableTax > 0) {
          gameTotals[gameId].sessionsWithTax += 1;
        }
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
            tax: 0,
            sessionsWithTax: 0,
          };
        }
      }
    });
    
    // Calculate total game sales (sum of all game totals)
    const snookerTotal = Object.values(gameTotals).reduce((sum, game) => sum + game.total, 0);
    
    // Calculate total taxes collected (sum of all game taxes + canteen tax)
    const totalTaxes = Object.values(gameTotals).reduce((sum, game) => sum + game.tax, 0) + canteenTax;
    
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalCash = sales
      .filter((s) => s.paymentMethod === 'CASH' || s.paymentMethod === 'MIXED')
      .reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalCard = sales
      .filter((s) => s.paymentMethod === 'CARD')
      .reduce((sum, sale) => sum + Number(sale.total), 0);

    // Top products and calculate profit from product cost
    const productSales: Record<string, { product: any; quantity: number; revenue: number; profit: number }> = {};
    let totalProductProfit = 0;
    
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += Number(item.subtotal);
        
        // Calculate profit: revenue (subtotal) - cost
        // Use subtotal as it's the actual revenue received (may include discounts)
        const revenue = Number(item.subtotal);
        const productCost = item.product?.cost ? Number(item.product.cost) : 0;
        const itemCost = productCost * item.quantity;
        const itemProfit = revenue - itemCost;
        productSales[item.productId].profit += itemProfit;
        totalProductProfit += itemProfit;
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
    
    // Total profit = Product profit + Table earnings (pure profit) - Expenses
    // Table earnings are pure profit with no cost
    const totalProfit = totalProductProfit + snookerTotal - totalExpenses;

    return {
      date: date.toISOString().split('T')[0],
      totalSales,
      snookerTotal,
      canteenTotal,
      totalTaxes,
      canteenTax,
      canteenSalesWithTax,
      gameTotals: Object.values(gameTotals),
      totalExpenses,
      totalProductProfit,
      totalProfit,
      totalCash,
      totalCard,
      saleCount: sales.length,
      topProducts,
      tableSessions: tableSessions.length,
      averageSaleValue: sales.length > 0 ? totalSales / sales.length : 0,
    };
  }

  async getDateRangeReport(startDate: Date, endDate: Date) {
    const startOfStartDay = new Date(startDate);
    startOfStartDay.setHours(0, 0, 0, 0);
    const endOfEndDay = new Date(endDate);
    endOfEndDay.setHours(23, 59, 59, 999);

    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfStartDay,
          lte: endOfEndDay,
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
    const gameTotals: Record<string, { gameName: string; total: number; tableSessions: number; tax: number; sessionsWithTax: number }> = {};
    let canteenTotal = 0;
    let canteenTax = 0;
    let canteenSalesWithTax = 0;
    
    sales.forEach((sale) => {
      // Calculate canteen total and tax from items
      let saleCanteenTax = 0;
      const saleCanteenSubtotal = sale.items.reduce(
        (sum, item) => {
          const itemTax = Number(item.tax || 0);
          saleCanteenTax += itemTax;
          return sum + Number(item.subtotal);
        },
        0
      );
      canteenTotal += saleCanteenSubtotal;
      canteenTax += saleCanteenTax;
      if (saleCanteenTax > 0) {
        canteenSalesWithTax += 1;
      }
      
      // Calculate table charge per game
      if (sale.table && sale.table.game) {
        const gameId = sale.table.game.id;
        const gameName = sale.table.game.name;
        
        if (!gameTotals[gameId]) {
          gameTotals[gameId] = {
            gameName,
            total: 0,
            tableSessions: 0,
            tax: 0,
            sessionsWithTax: 0,
          };
        }
        
        const canteenItemsSubtotal = sale.items.reduce(
          (sum, item) => sum + Number(item.subtotal),
          0
        );
        const tableCharge = Number(sale.subtotal) - canteenItemsSubtotal;
        gameTotals[gameId].total += tableCharge;
        
        const totalSaleTax = Number(sale.tax || 0);
        const tableTax = totalSaleTax - saleCanteenTax;
        gameTotals[gameId].tax += Math.max(0, tableTax);
        if (tableTax > 0) {
          gameTotals[gameId].sessionsWithTax += 1;
        }
      }
    });
    
    // Count table sessions per game
    const tableSessions = await this.prisma.tableSession.findMany({
      where: {
        startedAt: {
          gte: startOfStartDay,
          lte: endOfEndDay,
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
            tax: 0,
            sessionsWithTax: 0,
          };
        }
      }
    });
    
    // Calculate total game sales
    const snookerTotal = Object.values(gameTotals).reduce((sum, game) => sum + game.total, 0);
    
    // Calculate total taxes
    const totalTaxes = Object.values(gameTotals).reduce((sum, game) => sum + game.tax, 0) + canteenTax;
    
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalCash = sales
      .filter((s) => s.paymentMethod === 'CASH' || s.paymentMethod === 'MIXED')
      .reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalCard = sales
      .filter((s) => s.paymentMethod === 'CARD')
      .reduce((sum, sale) => sum + Number(sale.total), 0);

    // Top products and calculate profit
    const productSales: Record<string, { product: any; quantity: number; revenue: number; profit: number }> = {};
    let totalProductProfit = 0;
    
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += Number(item.subtotal);
        
        // Calculate profit: revenue (subtotal) - cost
        // Use subtotal as it's the actual revenue received (may include discounts)
        const revenue = Number(item.subtotal);
        const productCost = item.product?.cost ? Number(item.product.cost) : 0;
        const itemCost = productCost * item.quantity;
        const itemProfit = revenue - itemCost;
        productSales[item.productId].profit += itemProfit;
        totalProductProfit += itemProfit;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Calculate expenses for the date range
    const expenses = await this.prisma.expense.findMany({
      where: {
        date: {
          gte: startOfStartDay,
          lte: endOfEndDay,
        },
      },
    });
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    
    // Total profit = Product profit + Table earnings (pure profit) - Expenses
    // Table earnings are pure profit with no cost
    const totalProfit = totalProductProfit + snookerTotal - totalExpenses;

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalSales,
      snookerTotal,
      canteenTotal,
      totalTaxes,
      canteenTax,
      canteenSalesWithTax,
      gameTotals: Object.values(gameTotals),
      totalExpenses,
      totalProductProfit,
      totalProfit,
      totalCash,
      totalCard,
      saleCount: sales.length,
      topProducts,
      tableSessions: tableSessions.length,
      averageSaleValue: sales.length > 0 ? totalSales / sales.length : 0,
    };
  }
}

