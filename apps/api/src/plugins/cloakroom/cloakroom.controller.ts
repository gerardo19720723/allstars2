import { Controller, Post, Get, Body, Param, Headers } from '@nestjs/common';
import { CloakroomService } from './cloakroom.service';

@Controller('cloakroom') // Ruta en inglés suele ser estándar en APIs
export class CloakroomController {
  constructor(private readonly service: CloakroomService) {}

  @Post('store')
  store(@Headers('x-tenant-id') tenantId: string, @Body() dto: any) {
    return this.service.storeItem(tenantId, dto);
  }

  @Post('return/:ticketCode')
  returnItem(@Headers('x-tenant-id') tenantId: string, @Param('ticketCode') code: string) {
    return this.service.returnItem(code, tenantId);
  }

  @Get('stored')
  list(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getStoredItems(tenantId);
  }
}