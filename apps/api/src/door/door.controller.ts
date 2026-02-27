import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { DoorService } from './door.service';
import { CheckInDto } from './dto/check-in.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('door')
@UseGuards(JwtAuthGuard) // El seguridad necesita loguearse
export class DoorController {
  constructor(private readonly doorService: DoorService) {}

  // Endpoint para el Escáner QR
  @Post('check-in')
  checkIn(@Body() dto: CheckInDto, @TenantId() tenantId: string) {
    return this.doorService.checkIn(dto, tenantId);
  }

  // Endpoint para ver el aforo en tiempo real
  @Get('capacity')
  getCapacity(@TenantId() tenantId: string) {
    return this.doorService.getCapacity(tenantId);
  }
}