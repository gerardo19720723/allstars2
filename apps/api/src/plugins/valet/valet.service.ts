import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ValetService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene la lista de cajones de un nivel (Piso 1, Piso 2, etc.)
   * para pintar el Grid en el Frontend.
   */
  async getSpots(tenantId: string, level: string) {
    return this.prisma.valetSpot.findMany({
      where: { 
        tenantId, 
        level 
      },
      include: {
        // Incluimos el ticket activo para saber si está ocupado y cuál es el código
        tickets: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
      orderBy: { number: 'asc' },
    });
  }

  /**
   * Amplía el estacionamiento añadiendo nuevos cajones libres al nivel actual.
   */
  async addSpots(tenantId: string, level: string, count: number) {
    // Calculamos cuántos cajones hay ya para numerar los nuevos
    const existingCount = await this.prisma.valetSpot.count({
      where: { tenantId, level }
    });

    const newSpots = Array.from({ length: count }).map((_, i) => ({
      tenantId,
      level,
      // Número secuencial simple, puede mejorarse
      number: (existingCount + i + 1).toString().padStart(2, '0'), 
      status: 'FREE',
    }));

    return this.prisma.valetSpot.createMany({
      data: newSpots,
      skipDuplicates: true,
    });
  }

  /**
   * LÓGICA PRINCIPAL: Asignar un cajón (Tocar cajón verde).
   * Crea el Ticket y marca el cajón como OCUPPIED.
   */
  async assignSpot(tenantId: string, spotId: string) {
    // 1. Verificar que el cajón existe y está libre
    const spot = await this.prisma.valetSpot.findFirst({
      where: { id: spotId, tenantId },
    });

    if (!spot) throw new NotFoundException('Cajón no encontrado');
    if (spot.status === 'OCCUPIED') {
      throw new BadRequestException('Este cajón ya está ocupado');
    }

    // 2. Generar código de ticket aleatorio
    const ticketCode = randomBytes(4).toString('hex').toUpperCase();

    // 3. Transacción: Crear Ticket y Actualizar Spot al mismo tiempo
    const [newTicket] = await this.prisma.$transaction([
      this.prisma.valetTicket.create({
        data: {
          ticketCode,
          spotId,
          tenantId,
          status: 'ACTIVE',
        },
      }),
      this.prisma.valetSpot.update({
        where: { id: spotId },
        data: { status: 'OCCUPIED' },
      }),
    ]);

    return newTicket;
  }

  /**
   * Salida de Vehículo (Usando el código de ticket).
   * Marca el ticket como EXITED y libera el cajón (FREE).
   */
  async exitVehicle(tenantId: string, ticketCode: string) {
    // 1. Buscar el ticket activo
    const ticket = await this.prisma.valetTicket.findFirst({
      where: { 
        ticketCode, 
        tenantId, 
        status: 'ACTIVE' 
      },
      include: { spot: true }
    });

    if (!ticket) {
      throw new BadRequestException('Ticket no encontrado, inválido o ya fue usado');
    }

    // 2. Transacción: Cerrar ticket y liberar cajón
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.valetTicket.update({
        where: { id: ticket.id },
        data: { status: 'EXITED', exitAt: now },
      }),
      this.prisma.valetSpot.update({
        where: { id: ticket.spotId },
        data: { status: 'FREE' },
      }),
    ]);

    return { success: true, exitTime: now };
  }
}