import { Controller, Post, Body, Get, Param, UseGuards, Patch } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { UserId } from '../common/decorators/current-user.decorator';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto, 
    @TenantId() tenantId: string,
    @UserId() userId: string // Extraer el ID del usuario logueado
  ) {
    return this.orderService.create(createOrderDto, tenantId, userId);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.orderService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.orderService.findOne(id, tenantId);
  }

    @Patch(':id') // <--- Debe haber esto antes del método
  update(
    @Param('id') id: string, 
    @Body() updateOrderDto: UpdateOrderDto, 
    @TenantId() tenantId: string
  ) {
    return this.orderService.update(id, updateOrderDto, tenantId);
  }
}