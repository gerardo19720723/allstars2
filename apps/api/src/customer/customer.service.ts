import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    // Cálculo de Rango
    let rank = 'Novato';
    if (customer.points > 50) rank = 'Bronce';
    if (customer.points > 150) rank = 'Plata';
    if (customer.points > 300) rank = 'Oro';
    if (customer.points > 500) rank = 'Platino';
    if (customer.points > 1000) rank = 'LEGENDARIO';

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