import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CloakroomService {
  constructor(private prisma: PrismaService) {}

  async storeItem(tenantId: string, dto: any) {
    const ticketCode = randomBytes(3).toString('hex').toUpperCase();
    return this.prisma.cloakroom.create({ // Nota: es 'cloakroom'
      data: {
        tenantId,
        description: dto.description,
        customerName: dto.customerName,
        ticketCode,
        status: 'STORED',
      },
    });
  }

  async returnItem(ticketCode: string, tenantId: string) {
    const item = await this.prisma.cloakroom.findFirst({
      where: { ticketCode, tenantId, status: 'STORED' },
    });
    if (!item) throw new BadRequestException('Prenda no encontrada o ya entregada');
    return this.prisma.cloakroom.update({
      where: { id: item.id },
      data: { status: 'RETURNED', returnedAt: new Date() },
    });
  }

  getStoredItems(tenantId: string) {
    return this.prisma.cloakroom.findMany({
      where: { tenantId, status: 'STORED' },
    });
  }
}