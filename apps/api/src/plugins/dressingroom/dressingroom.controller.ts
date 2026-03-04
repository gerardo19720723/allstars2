import { Controller, Post, Get, Body, Param, Headers } from '@nestjs/common';
import { DressingroomService } from './dressingroom.service';

@Controller('dressingrooms')
export class DressingroomController {
  constructor(private readonly service: DressingroomService) {}

  @Get()
  list(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getRooms(tenantId);
  }

  @Post(':id/occupy')
  occupy(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.service.occupyRoom(tenantId, id, dto);
  }

  @Post(':id/vacate')
  vacate(@Param('id') id: string) {
    return this.service.vacateRoom(id);
  }
}