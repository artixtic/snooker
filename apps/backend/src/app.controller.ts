import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('debug/login-test')
  async debugLoginTest(@Body() body: { username: string; password: string }) {
    try {
      // Find user
      const user = await this.prisma.user.findFirst({
        where: {
          username: body.username,
          deleted: false,
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          username: body.username,
        };
      }

      // Check password
      const passwordMatch = await bcrypt.compare(body.password, user.password);

      return {
        success: passwordMatch,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          deleted: user.deleted,
        },
        passwordMatch,
        passwordHash: user.password.substring(0, 20) + '...',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }
}

