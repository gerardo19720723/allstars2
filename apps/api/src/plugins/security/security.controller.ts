import { Controller, Post, Get, Body, Param, Headers } from '@nestjs/common';
import { SecurityService } from './security.service';

@Controller('security')
export class SecurityController {
  constructor(private readonly service: SecurityService) {}

  @Get('active')
  getActive(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getActiveIncidents(tenantId);
  }

  @Post('report')
  report(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: any
  ) {
    return this.service.reportIncident(tenantId, body);
  }

  @Post('resolve/:id')
  resolve(@Param('id') id: string) {
    return this.service.resolveIncident(id);
  }
}