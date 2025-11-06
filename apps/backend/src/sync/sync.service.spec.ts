import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SyncService', () => {
  let service: SyncService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    product: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    sale: {
      create: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('push', () => {
    it('should process product creation operation', async () => {
      const clientId = 'test-client';
      const operations = [
        {
          opId: 'op1',
          entity: 'product',
          action: 'create',
          payload: { name: 'Test Product', price: 10, stock: 100 },
          clientUpdatedAt: new Date().toISOString(),
          clientId,
        },
      ];

      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback({
          product: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'server-id-1' }),
          },
        }),
      );

      const result = await service.push(clientId, operations);

      expect(result.processed).toBe(1);
      expect(result.createdServerIds).toHaveProperty('op1');
    });
  });
});

