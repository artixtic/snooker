import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { TablesService } from './tables.service';
import { PrismaService } from '../prisma/prisma.service';
import { StartTableDto } from './dto/start-table.dto';

describe('TablesService', () => {
  let service: TablesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    tableSession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    game: {
      findUnique: jest.fn(),
    },
    sale: {
      create: jest.fn(),
    },
    shift: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all tables with game data', async () => {
      const mockTables = [
        { id: '1', tableNumber: 1, status: 'AVAILABLE', game: { id: '1', name: 'Snooker' } },
        { id: '2', tableNumber: 2, status: 'OCCUPIED', game: { id: '1', name: 'Snooker' } },
      ];

      mockPrismaService.tableSession.findMany.mockResolvedValue(mockTables);

      const result = await service.findAll();

      expect(result).toEqual(mockTables);
      expect(mockPrismaService.tableSession.findMany).toHaveBeenCalledWith({
        include: { game: true },
        orderBy: { tableNumber: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create a new table', async () => {
      const createDto = { tableNumber: 1, gameId: 'game1' };
      const mockGame = { id: 'game1', defaultRate: 100 };
      const mockTable = { id: '1', ...createDto, status: 'AVAILABLE', ratePerHour: 100 };

      mockPrismaService.tableSession.findUnique.mockResolvedValue(null);
      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);
      mockPrismaService.tableSession.create.mockResolvedValue(mockTable);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTable);
      expect(mockPrismaService.tableSession.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when table number already exists', async () => {
      const createDto = { tableNumber: 1, gameId: 'game1' };
      const existingTable = { id: '1', tableNumber: 1 };

      mockPrismaService.tableSession.findUnique.mockResolvedValue(existingTable);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when game not found', async () => {
      const createDto = { tableNumber: 1, gameId: 'game1' };

      mockPrismaService.tableSession.findUnique.mockResolvedValue(null);
      mockPrismaService.game.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('start', () => {
    it('should start an available table', async () => {
      const tableId = '1';
      const dto: StartTableDto = {};
      const employeeId = 'emp1';
      const mockTable = {
        id: tableId,
        status: 'AVAILABLE',
        tableNumber: 1,
        game: { id: 'game1', name: 'Snooker', defaultRate: 100 },
      };
      const updatedTable = { ...mockTable, status: 'OCCUPIED', startedAt: new Date() };
      const mockShift = { id: 'shift1', status: 'ACTIVE', employeeId };

      mockPrismaService.tableSession.findUnique.mockResolvedValue(mockTable);
      mockPrismaService.shift.findFirst.mockResolvedValue(mockShift);
      mockPrismaService.tableSession.update.mockResolvedValue(updatedTable);

      const result = await service.start(tableId, dto, employeeId);

      expect(result.status).toBe('OCCUPIED');
      expect(result.startedAt).toBeDefined();
      expect(mockPrismaService.tableSession.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when table not found', async () => {
      const tableId = '1';
      const dto: StartTableDto = {};
      const employeeId = 'emp1';

      mockPrismaService.tableSession.findUnique.mockResolvedValue(null);

      await expect(service.start(tableId, dto, employeeId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no active shift', async () => {
      const tableId = '1';
      const dto: StartTableDto = {};
      const employeeId = 'emp1';
      const mockTable = {
        id: tableId,
        status: 'AVAILABLE',
        tableNumber: 1,
        game: { id: 'game1', name: 'Snooker' },
      };

      mockPrismaService.tableSession.findUnique.mockResolvedValue(mockTable);
      mockPrismaService.shift.findFirst.mockResolvedValue(null);

      await expect(service.start(tableId, dto, employeeId)).rejects.toThrow(BadRequestException);
    });

    it('should return table when already occupied (idempotent)', async () => {
      const tableId = '1';
      const dto: StartTableDto = {};
      const employeeId = 'emp1';
      const mockTable = {
        id: tableId,
        status: 'OCCUPIED',
        startedAt: new Date(),
      };

      mockPrismaService.tableSession.findUnique.mockResolvedValue(mockTable);

      const result = await service.start(tableId, dto, employeeId);

      expect(result).toEqual(mockTable);
    });
  });

  describe('stop', () => {
    it('should stop an occupied table and calculate charge', async () => {
      const tableId = '1';
      const dto = { paymentMethod: 'CASH', paymentAmount: 100 };
      const employeeId = 'emp1';
      const startedAt = new Date(Date.now() - 3600000); // 1 hour ago
      const mockTable = {
        id: tableId,
        status: 'OCCUPIED',
        startedAt,
        ratePerHour: 100,
        pausedDuration: 0,
        currentCharge: 100,
      };
      const updatedTable = { ...mockTable, status: 'AVAILABLE', endedAt: new Date() };

      mockPrismaService.tableSession.findUnique.mockResolvedValue(mockTable);
      mockPrismaService.tableSession.update.mockResolvedValue(updatedTable);
      mockPrismaService.sale.create.mockResolvedValue({ id: 'sale1' });

      const result = await service.stop(tableId, dto, employeeId);

      expect(result.status).toBe('AVAILABLE');
      expect(mockPrismaService.sale.create).toHaveBeenCalled();
    });

    it('should throw Error when table not found', async () => {
      const tableId = '1';
      const dto = { paymentMethod: 'CASH', paymentAmount: 100 };
      const employeeId = 'emp1';

      mockPrismaService.tableSession.findUnique.mockResolvedValue(null);

      await expect(service.stop(tableId, dto, employeeId)).rejects.toThrow('Table not found');
    });

    it('should return table when already available (idempotent)', async () => {
      const tableId = '1';
      const dto = { paymentMethod: 'CASH', paymentAmount: 100 };
      const employeeId = 'emp1';
      const mockTable = {
        id: tableId,
        status: 'AVAILABLE',
      };

      mockPrismaService.tableSession.findUnique.mockResolvedValue(mockTable);

      const result = await service.stop(tableId, dto, employeeId);

      expect(result).toBeDefined();
    });
  });

  describe('pause', () => {
    it('should pause an occupied table', async () => {
      const tableId = '1';
      const mockTable = {
        id: tableId,
        status: 'OCCUPIED',
        startedAt: new Date(),
        lastResumedAt: new Date(),
        totalPausedMs: 0,
        ratePerHour: 100,
        game: { rateType: 'PER_MINUTE' },
      };
      const updatedTable = { ...mockTable, status: 'PAUSED', pausedAt: new Date() };

      mockPrismaService.tableSession.findUnique.mockResolvedValue(mockTable);
      mockPrismaService.tableSession.update.mockResolvedValue(updatedTable);

      const result = await service.pause(tableId);

      expect(result.status).toBe('PAUSED');
      expect(result.pausedAt).toBeDefined();
    });
  });

  describe('resume', () => {
    it('should resume a paused table', async () => {
      const tableId = '1';
      const pausedAt = new Date(Date.now() - 1800000); // 30 minutes ago
      const mockTable = {
        id: tableId,
        status: 'PAUSED',
        startedAt: new Date(Date.now() - 3600000),
        pausedAt,
        totalPausedMs: 0,
      };
      const updatedTable = { ...mockTable, status: 'OCCUPIED', pausedAt: null };

      mockPrismaService.tableSession.findUnique.mockResolvedValue(mockTable);
      mockPrismaService.tableSession.update.mockResolvedValue(updatedTable);

      const result = await service.resume(tableId);

      expect(result.status).toBe('OCCUPIED');
      expect(result.pausedAt).toBeNull();
    });
  });
});

