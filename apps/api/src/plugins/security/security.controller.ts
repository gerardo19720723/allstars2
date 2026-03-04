import { Controller, Post, Get, Body, Param, Headers } from '@nestjs/common';
import { SecurityService } from './security.service';

@Controller('security')
export class SecurityController {
  constructor(private readonly service: SecurityService) {}

  @Post('report')
  report(@Headers('x-tenant-id') tenantId: string, @Body() dto: any) {
    return this.service.reportIncident(tenantId, dto);
  }

  @Post('resolve/:id')
  resolve(@Param('id') id: string) {
    return this.service.resolveIncident(id);
  }

  @Get('active')
  list(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getActiveIncidents(tenantId);
  }
}