import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let prisma: PrismaService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      return 'default-secret';
    }),
  };

  const mockPrismaService = {
    activityLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        password: 'hashedpassword',
        role: 'EMPLOYEE',
        deleted: false,
        name: 'Test User',
      };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password');

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.username).toBe(mockUser.username);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(service.validateUser('testuser', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        password: 'hashedpassword',
        role: 'EMPLOYEE',
        deleted: false,
      };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('testuser', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when account is disabled', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        password: 'hashedpassword',
        role: 'EMPLOYEE',
        deleted: true,
      };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.validateUser('testuser', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access token, refresh token, and user data', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        role: 'EMPLOYEE',
        name: 'Test User',
      };

      mockJwtService.sign.mockReturnValue('mock-token');
      mockPrismaService.activityLog.create.mockResolvedValue({});

      const result = await service.login(mockUser);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.username).toBe(mockUser.username);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.activityLog.create).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should return new access token when refresh token is valid', async () => {
      const mockPayload = {
        sub: '1',
        username: 'testuser',
        role: 'EMPLOYEE',
      };

      const mockUser = {
        id: '1',
        username: 'testuser',
        role: 'EMPLOYEE',
        deleted: false,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const mockPayload = {
        sub: '1',
        username: 'testuser',
        role: 'EMPLOYEE',
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refreshToken('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

