import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all non-deleted products', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', deleted: false },
        { id: '2', name: 'Product 2', deleted: false },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(result).toEqual(mockProducts);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { deleted: false },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should filter by updatedAt when since is provided', async () => {
      const since = '2024-01-01T00:00:00Z';
      const mockProducts = [{ id: '1', name: 'Product 1', deleted: false }];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      await service.findAll(since);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          deleted: false,
          updatedAt: { gte: new Date(since) },
        },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const mockProduct = { id: '1', name: 'Product 1', deleted: false };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createDto = {
        name: 'New Product',
        price: 10,
        stock: 100,
        cost: 5,
      };
      const userId = 'user1';
      const mockProduct = { id: '1', ...createDto };

      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(createDto, userId);

      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          lastModifiedBy: userId,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto = { name: 'Updated Product', price: 15 };
      const userId = 'user1';
      const existingProduct = {
        id: '1',
        name: 'Product 1',
        version: 1,
        deleted: false,
      };
      const updatedProduct = { ...existingProduct, ...updateDto, version: 2 };

      mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update('1', updateDto, userId);

      expect(result.version).toBe(2);
      expect(mockPrismaService.product.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      const existingProduct = {
        id: '1',
        name: 'Product 1',
        deleted: false,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...existingProduct,
        deleted: true,
      });

      const result = await service.remove('1');

      expect(result.deleted).toBe(true);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deleted: true },
      });
    });
  });
});

