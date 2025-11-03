import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncPushRequest } from './dto/sync.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  async push(@Body() body: SyncPushRequest) {
    return this.syncService.push(body.clientId, body.operations);
  }

  @Get('pull')
  async pull(@Query('since') since: string, @Query('limit') limit?: number) {
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    return this.syncService.pull(sinceDate, limit ? parseInt(limit.toString()) : 1000);
  }
}

