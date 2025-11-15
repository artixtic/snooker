import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EnhancedBackupService } from './enhanced-backup.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { PrismaClient } from '@prisma/client';

describe('EnhancedBackupService', () => {
  let service: EnhancedBackupService;
  let prisma: PrismaService;
  let configService: ConfigService;
  let wsGateway: WebSocketGateway;

  const mockPrismaService = {
    $transaction: jest.fn(),
    syncState: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    backupHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    backupConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  };

  const mockBackupPrisma = {
    $transaction: jest.fn(),
    product: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'ENABLE_BACKUP_SERVICE') return 'true';
      if (key === 'ENABLE_TWO_WAY_SYNC') return 'true';
      if (key === 'BACKUP_RETENTION_DAYS') return '30';
      if (key === 'SYNC_INTERVAL_MS') return '30000';
      if (key === 'BACKUP_DATABASE_URL') return 'postgresql://backup:password@localhost:5432/backup';
      return defaultValue;
    }),
  };

  const mockWsGateway = {
    server: {
      emit: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedBackupService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: WebSocketGateway,
          useValue: mockWsGateway,
        },
      ],
    }).compile();

    service = module.get<EnhancedBackupService>(EnhancedBackupService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    wsGateway = module.get<WebSocketGateway>(WebSocketGateway);

    // Mock the backupPrisma property
    (service as any).backupPrisma = mockBackupPrisma;
    (service as any).isBackupEnabled = true;
    (service as any).isTwoWaySyncEnabled = true;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('performFullBackup', () => {
    it('should perform a full backup of all tables', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', stock: 100 },
        { id: '2', name: 'Product 2', stock: 50 },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockBackupPrisma.product.upsert.mockResolvedValue({});

      // Mock the getData methods
      jest.spyOn(service as any, 'getData').mockImplementation((entity: string) => {
        if (entity === 'Product') {
          return Promise.resolve(mockProducts);
        }
        return Promise.resolve([]);
      });

      const result = await (service as any).performFullBackup();

      expect(result).toBeDefined();
    });
  });

  describe('getBackupHistory', () => {
    it('should return backup history', async () => {
      const mockHistory = [
        {
          id: '1',
          status: 'SUCCESS',
          recordCount: 100,
          duration: 1000,
          size: BigInt(1024),
        },
      ];

      mockPrismaService.backupHistory.findMany.mockResolvedValue(mockHistory);

      const history = await service.getBackupHistory();

      expect(history).toBeDefined();
      expect(history).toEqual(mockHistory);
      expect(mockPrismaService.backupHistory.findMany).toHaveBeenCalled();
    });
  });
});

