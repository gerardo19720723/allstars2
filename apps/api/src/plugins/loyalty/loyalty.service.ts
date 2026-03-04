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

  async redeemReward(customerId: string, rewardCost: number) {
  const customer = await this.prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new BadRequestException('Customer not found');   // guard clause
  }

  if (customer.points < rewardCost) {
    throw new BadRequestException('Insufficient points');
  }

  const updatedCustomer = await this.prisma.customer.update({
    where: { id: customerId },
    data: {
      points: { decrement: rewardCost },
    },
  });

  return {
    ...updatedCustomer,
    newRank: calculateRank(updatedCustomer.points),
  };
}
}