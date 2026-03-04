import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateRank } from '../common/helpers/rank.helper';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async getMe(customerId: string) {
    // Buscar cliente
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    // Si no existe, devolvemos un objeto por defecto
    if (!customer) {
      return { id: customerId, points: 0, rank: 'NOVATO', email: null, phone: null };
    }

    const rank = calculateRank(customer.points);

    return {
      id: customer.id,
      points: customer.points,
      rank: rank,
      email: customer.email,
      phone: customer.phone,
    };
  }

    // Método para canjear puntos
  async redeemPoints(customerId: string, cost: number, rewardName: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Cliente no encontrado');
    }

    if (customer.points < cost) {
      throw new Error('No tienes suficientes puntos');
    }

    // Restamos los puntos
    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        points: { decrement: cost },
      },
    });

    return { 
      success: true, 
      newPoints: updated.points,
      reward: rewardName 
    };
  }
}