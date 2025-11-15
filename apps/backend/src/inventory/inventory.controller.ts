import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('movements')
  create(@Body() dto: CreateInventoryMovementDto, @CurrentUser() user: any) {
    return this.inventoryService.createMovement(dto, user.id);
  }

  @Get('movements')
  findAll(@Query('productId') productId?: string) {
    return this.inventoryService.findAllMovements(productId);
  }

  @Get('low-stock')
  getLowStock(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStockProducts(threshold ? parseInt(threshold.toString()) : 10);
  }
}

