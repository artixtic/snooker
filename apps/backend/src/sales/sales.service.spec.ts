import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SalesService', () => {
  let service: SalesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sale: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    inventoryMovement: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sale with items', async () => {
      const createDto = {
        items: [
          {
            productId: 'prod1',
            quantity: 2,
            unitPrice: 10,
            subtotal: 20,
          },
        ],
        subtotal: 20,
        total: 20,
        paymentMethod: 'CASH',
      };
      const employeeId = 'emp1';
      const mockProduct = {
        id: 'prod1',
        name: 'Test Product',
        stock: 100,
        deleted: false,
      };
      const mockSale = {
        id: 'sale1',
        receiptNumber: 'R001',
        ...createDto,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          product: {
            findUnique: jest.fn().mockResolvedValue(mockProduct),
            update: jest.fn(),
          },
          inventoryMovement: {
            create: jest.fn(),
          },
          sale: {
            create: jest.fn().mockResolvedValue(mockSale),
            findUnique: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
          },
        };
        return callback(tx);
      });

      const result = await service.create(createDto, employeeId);

      expect(result).toBeDefined();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      const createDto = {
        items: [
          {
            productId: 'prod1',
            quantity: 2,
            unitPrice: 10,
            subtotal: 20,
          },
        ],
        subtotal: 20,
        total: 20,
        paymentMethod: 'CASH',
      };
      const employeeId = 'emp1';

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          product: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          sale: {
            findUnique: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
          },
        };
        return callback(tx);
      });

      await expect(service.create(createDto, employeeId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      const createDto = {
        items: [
          {
            productId: 'prod1',
            quantity: 200,
            unitPrice: 10,
            subtotal: 2000,
          },
        ],
        subtotal: 2000,
        total: 2000,
        paymentMethod: 'CASH',
      };
      const employeeId = 'emp1';
      const mockProduct = {
        id: 'prod1',
        name: 'Test Product',
        stock: 100,
        deleted: false,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          product: {
            findUnique: jest.fn().mockResolvedValue(mockProduct),
          },
          sale: {
            findUnique: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
          },
        };
        return callback(tx);
      });

      await expect(service.create(createDto, employeeId)).rejects.toThrow(BadRequestException);
    });

    it('should create a sale without items (table-only)', async () => {
      const createDto = {
        subtotal: 100,
        total: 100,
        paymentMethod: 'CASH',
        tableId: 'table1',
      };
      const employeeId = 'emp1';
      const mockSale = {
        id: 'sale1',
        receiptNumber: 'R001',
        ...createDto,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          sale: {
            create: jest.fn().mockResolvedValue(mockSale),
            findUnique: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
          },
        };
        return callback(tx);
      });

      const result = await service.create(createDto, employeeId);

      expect(result).toBeDefined();
    });
  });
});

