import { Controller, Post, Get, Body, Param, Headers, BadRequestException } from '@nestjs/common';
import { ValetService } from './valet.service';

@Controller('valet')
export class ValetController {
  constructor(private readonly valetService: ValetService) {}

  @Get('spots/:level')
  getSpots(
    @Headers('x-tenant-id') tenantId: string, 
    @Param('level') level: string
  ) {
    return this.valetService.getSpots(tenantId, level);
  }

  @Post('add-spots')
  addSpots(
    @Headers('x-tenant-id') tenantId: string, 
    @Body() body: { level: string; count: number }
  ) {
    return this.valetService.addSpots(tenantId, body.level, body.count);
  }

  @Post('assign')
  assignSpot(
    @Headers('x-tenant-id') tenantId: string, 
    @Body() body: { spotId: string }
  ) {
    return this.valetService.assignSpot(tenantId, body.spotId);
  }

  @Post('exit')
  exitVehicle(
    @Headers('x-tenant-id') tenantId: string, 
    @Body() body: { ticketCode: string }
  ) {
    return this.valetService.exitVehicle(tenantId, body.ticketCode);
  }

    @Post('claim')
  claimTicket(
    @Headers('x-tenant-id') tenantId: string, 
    @Body() body: { customerId: string; ticketCode: string }
  ) {
    return this.valetService.claimTicket(body.customerId, body.ticketCode, tenantId);
  }
}