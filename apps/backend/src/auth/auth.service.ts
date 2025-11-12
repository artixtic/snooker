import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    this.logger.debug(`Attempting to validate user: ${username}`);
    
    try {
      const user = await this.usersService.findByUsername(username);
      
      if (!user) {
        this.logger.warn(`User not found: ${username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.debug(`User found: ${username}, checking password...`);
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user: ${username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.deleted) {
        this.logger.warn(`Account disabled for user: ${username}`);
        throw new UnauthorizedException('Account is disabled');
      }

      this.logger.log(`User validated successfully: ${username}`);
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error validating user ${username}: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };

    // Access token never expires
    const accessToken = this.jwtService.sign(payload);
    // Refresh token also never expires
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      // No expiration
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'login',
        entity: 'user',
        entityId: user.id,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify token but ignore expiration since tokens never expire
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        ignoreExpiration: true,
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.deleted) {
        throw new UnauthorizedException();
      }

      const newPayload = { username: user.username, sub: user.id, role: user.role };
      // New access token also never expires
      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

