import { Controller, Post, Body, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user);

    // Set HTTP-only cookies for refresh token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req: any) {
    // Try to get refresh token from cookie first, then body
    const refreshToken = req.cookies?.refreshToken || refreshTokenDto.refreshToken;
    if (!refreshToken) {
      throw new Error('Refresh token required');
    }

    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }
}

