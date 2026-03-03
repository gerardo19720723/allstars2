import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { CustomerService } from './customer.service'; // <--- Importar servicio

@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {} // <--- Inyectar

  @Get('me')
  async getMe(@Req() req: any) {
    const customerId = req.query.id as string;
    if (!customerId) return { error: "ID de cliente requerido" };
    
    // Llamamos al servicio
    return this.customerService.getMe(customerId);
  }

  @Post('redeem')
  async redeem(@Body() body: { customerId: string, cost: number, rewardName: string }) {
    try {
      return await this.customerService.redeemPoints(body.customerId, body.cost, body.rewardName);
    } catch (error: any) {
      // Si falla (ej. puntos insuficientes), devolvemos el error con código 400
      throw new Error(error.message);
    }
  }
}