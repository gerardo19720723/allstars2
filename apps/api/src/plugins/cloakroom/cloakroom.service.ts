import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { DjGateway } from '../../dj-session/gateways/dj.gateway';

@Injectable()
export class CloakroomService {
  constructor(
    private prisma: PrismaService,
    private djGateway: DjGateway,
  ) {}

  async getBins(tenantId: string, section: string) {
    return this.prisma.cloakroomBin.findMany({
      where: { tenantId, section },
      include: {
        items: {
          where: { status: 'STORED' },
          take: 1,
        },
      },
      orderBy: { number: 'asc' },
    });
  }

  async addBins(tenantId: string, section: string, count: number) {
    const existingCount = await this.prisma.cloakroomBin.count({
      where: { tenantId, section }
    });

    const newBins = Array.from({ length: count }).map((_, i) => ({
      tenantId,
      section,
      number: (existingCount + i + 1).toString().padStart(2, '0'), 
      status: 'FREE',
    }));

    return this.prisma.cloakroomBin.createMany({
      data: newBins,
      skipDuplicates: true,
    });
  }

  /**
   * ASIGNAR BIN (GUARDAR PRENDA)
   */
  async assignBin(tenantId: string, binId: string, data: { description: string; quantity: number; customerName?: string; customerId?: string }) {
    const bin = await this.prisma.cloakroomBin.findFirst({
      where: { id: binId, tenantId },
    });

    if (!bin) throw new NotFoundException('Cubículo no encontrado');
    if (bin.status === 'OCCUPIED') throw new BadRequestException('Cubículo ocupado');

    const ticketCode = randomBytes(4).toString('hex').toUpperCase();

    // Asegurar cliente
    if (data.customerId) {
      await this.prisma.customer.upsert({
        where: { id: data.customerId },
        update: {},
        create: { id: data.customerId, tenantId, points: 0 },
      });
    }

    const [newItem] = await this.prisma.$transaction([
      this.prisma.cloakroomItem.create({
        data: {
          ticketCode,
          binId,
          tenantId,
          status: 'STORED',
          description: data.description,
          quantity: data.quantity || 1, // <--- GUARDAR CANTIDAD
          customerName: data.customerName,
          customerId: data.customerId || null,
        },
        include: { bin: true }
      }),
      this.prisma.cloakroomBin.update({
        where: { id: binId },
        data: { status: 'OCCUPIED' },
      }),
    ]);

    // PUSH
    if (data.customerId && this.djGateway?.server) {
      this.djGateway.server.emit(`ticket:${data.customerId}`, newItem);
    }

    return newItem;
  }

  /**
   * LIBERAR BIN (ENTREGAR)
   */
  async releaseBin(itemId: string) {
    const item = await this.prisma.cloakroomItem.findFirst({
      where: { id: itemId, status: 'STORED' },
      include: { bin: true }
    });

    if (!item) throw new BadRequestException('Prenda no encontrada');

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.cloakroomItem.update({
        where: { id: itemId },
        data: { status: 'RETURNED', returnedAt: now },
      }),
      this.prisma.cloakroomBin.update({
        where: { id: item.binId },
        data: { status: 'FREE' },
      }),
    ]);

    // PUSH DE SALIDA
    if (item.customerId && this.djGateway?.server) {
      this.djGateway.server.emit(`cloakroom_returned:${item.customerId}`, { message: "Tu prenda está lista." });
    }

    return { success: true };
  }

  async requestItem(ticketCode: string, tenantId: string) {
    const item = await this.prisma.cloakroomItem.findFirst({
      where: { ticketCode, tenantId, status: 'STORED' },
      include: { bin: true }
    });

    if (!item) throw new BadRequestException('Prenda no encontrada');

    if (this.djGateway?.server) {
      this.djGateway.server.emit('staff_alert_cloakroom', {
        binId: item.binId,
        ticketCode: item.ticketCode,
        message: `Solicitando: ${item.description}`
      });
    }
    return { success: true };
  }
}