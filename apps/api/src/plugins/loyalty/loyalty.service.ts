import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateRank } from '../../common/helpers/rank.helper';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  // CORREGIDO: Ahora acepta customerId en lugar de points directos
  async getCustomerRank(customerId: string): Promise<string> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Usamos el helper con los puntos obtenidos de la BD
    return calculateRank(customer.points);
  }

  async getCustomerProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) throw new BadRequestException('Customer not found');

    const rank = await this.getCustomerRank(customerId); // Llamada corregida

    return {
      id: customer.id,
      points: customer.points,
      rank: rank,
      email: customer.email,
    };
  }

  async redeemReward(customerId: string, cost: number) {
    // 1. Buscar cliente
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) throw new BadRequestException('Cliente no encontrado');

    // 2. Validar Puntos
    if (customer.points < cost) {
      throw new BadRequestException(`Puntos insuficientes. Tienes ${customer.points} y necesitas ${cost}.`);
    }

    // 3. Transacción: Descontar puntos
    const updatedCustomer = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        points: { decrement: cost },
      },
    });

    // 4. Calcular nuevo rango (puede que baje de nivel si canjea mucho)
    const newRank = calculateRank(updatedCustomer.points);

    return { 
      success: true, 
      newPoints: updatedCustomer.points, 
      newRank 
    };
  }
}