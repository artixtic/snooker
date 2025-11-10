import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KitchenOrdersService } from './kitchen-orders.service';
import { CreateKitchenOrderDto } from './dto/create-kitchen-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KitchenOrderStatus } from '@prisma/client';

@Controller('kitchen-orders')
@UseGuards(JwtAuthGuard)
export class KitchenOrdersController {
  constructor(private readonly kitchenOrdersService: KitchenOrdersService) {}

  @Post()
  create(@Body() createKitchenOrderDto: CreateKitchenOrderDto) {
    return this.kitchenOrdersService.create(createKitchenOrderDto);
  }

  @Get()
  findAll(@Query('status') status?: KitchenOrderStatus) {
    return this.kitchenOrdersService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kitchenOrdersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: KitchenOrderStatus) {
    return this.kitchenOrdersService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kitchenOrdersService.remove(id);
  }
}

