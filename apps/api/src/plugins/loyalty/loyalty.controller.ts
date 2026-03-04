import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('rank/:customerId')
  async getRank(@Param('customerId') customerId: string) {
    return this.loyaltyService.getCustomerRank(customerId);
  }

  @Post('redeem')
  async redeem(@Body() body: { customerId: string; cost: number }) {
    return this.loyaltyService.redeemReward(body.customerId, body.cost);
  }
}