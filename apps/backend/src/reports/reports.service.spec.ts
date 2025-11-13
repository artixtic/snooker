import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    sale: {
      findMany: jest.fn(),
    },
    tableSession: {
      findMany: jest.fn(),
    },
    expense: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDailyReport', () => {
    it('should calculate daily report correctly', async () => {
      const date = new Date('2024-01-01');
      const mockSales = [
        {
          id: 'sale1',
          subtotal: 100,
          total: 100,
          tax: 0,
          paymentMethod: 'CASH',
          items: [
            {
              productId: 'prod1',
              quantity: 2,
              subtotal: 20,
              product: {
                id: 'prod1',
                name: 'Product 1',
                cost: 5,
              },
            },
          ],
          table: {
            id: 'table1',
            game: {
              id: 'game1',
              name: 'Snooker',
            },
          },
        },
      ];

      const mockTableSessions = [
        {
          id: 'session1',
          game: {
            id: 'game1',
            name: 'Snooker',
          },
        },
      ];

      mockPrismaService.sale.findMany.mockResolvedValue(mockSales);
      mockPrismaService.tableSession.findMany.mockResolvedValue(mockTableSessions);
      mockPrismaService.expense.findMany.mockResolvedValue([]);

      const result = await service.getDailyReport(date);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('snookerTotal');
      expect(result).toHaveProperty('canteenTotal');
      expect(result).toHaveProperty('totalProductProfit');
      expect(result).toHaveProperty('totalProfit');
    });

    it('should calculate profit correctly', async () => {
      const date = new Date('2024-01-01');
      const mockSales = [
        {
          id: 'sale1',
          subtotal: 100,
          total: 100,
          tax: 0,
          paymentMethod: 'CASH',
          items: [
            {
              productId: 'prod1',
              quantity: 2,
              subtotal: 20, // revenue
              product: {
                id: 'prod1',
                name: 'Product 1',
                cost: 5, // cost per unit
              },
            },
          ],
          table: null,
        },
      ];

      mockPrismaService.sale.findMany.mockResolvedValue(mockSales);
      mockPrismaService.tableSession.findMany.mockResolvedValue([]);
      mockPrismaService.expense.findMany.mockResolvedValue([]);

      const result = await service.getDailyReport(date);

      // Profit = revenue - (cost * quantity) = 20 - (5 * 2) = 10
      expect(result.totalProductProfit).toBe(10);
    });

    it('should include table earnings as pure profit', async () => {
      const date = new Date('2024-01-01');
      const mockSales = [
        {
          id: 'sale1',
          subtotal: 100,
          total: 100,
          tax: 0,
          paymentMethod: 'CASH',
          items: [],
          table: {
            id: 'table1',
            game: {
              id: 'game1',
              name: 'Snooker',
            },
          },
        },
      ];

      mockPrismaService.sale.findMany.mockResolvedValue(mockSales);
      mockPrismaService.tableSession.findMany.mockResolvedValue([]);
      mockPrismaService.expense.findMany.mockResolvedValue([]);

      const result = await service.getDailyReport(date);

      // Table earnings (100) should be included in total profit
      expect(result.snookerTotal).toBe(100);
      expect(result.totalProfit).toBe(100); // Pure profit from table
    });
  });

  describe('getDateRangeReport', () => {
    it('should calculate date range report correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrismaService.sale.findMany.mockResolvedValue([]);
      mockPrismaService.tableSession.findMany.mockResolvedValue([]);
      mockPrismaService.expense.findMany.mockResolvedValue([]);

      const result = await service.getDateRangeReport(startDate, endDate);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('snookerTotal');
      expect(result).toHaveProperty('canteenTotal');
      expect(result).toHaveProperty('totalProductProfit');
    });
  });
});

