import { Controller, Post, Get, Headers, Body } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly service: LoyaltyService) {}

  @Get('profile')
  getProfile(@Headers('x-tenant-id') tenantId: string, @Headers('x-customer-id') customerId: string) {
    return this.service.getCustomerProfile(customerId);
  }

  @Get('rewards')
  getRewards() {
    // Lista de premios fija por ahora (en el futuro vendrá de la BD)
    return [
      { id: 1, name: 'Shot de Tequila', cost: 100, icon: '🥃' },
      { id: 2, name: 'Cerveza Free', cost: 150, icon: '🍺' },
      { id: 3, name: 'Entrada VIP', cost: 500, icon: '🎟' },
      { id: 4, name: 'Botella Champagne', cost: 1000, icon: '🍾' },
    ];
  }

  @Post('redeem')
  redeem(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-customer-id') customerId: string, 
    @Body() body: { cost: number }
  ) {
    return this.service.redeemReward(customerId, body.cost);
  }
}