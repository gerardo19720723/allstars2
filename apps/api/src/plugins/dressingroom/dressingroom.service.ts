import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DressingroomService {
  constructor(private prisma: PrismaService) {}

  // Inicializar cuartos si no existen (opcional, o se crean manual en DB)
  async getRooms(tenantId: string) {
    return this.prisma.dressingroom.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

 async occupyRoom(tenantId: string, roomId: string, dto: any) {
  const room = await this.prisma.dressingroom.findFirst({
    where: { id: roomId, tenantId },
  });

  if (!room) {
    throw new BadRequestException('Cuarto no encontrado');
  }

  if (room.status !== 'FREE') {
    throw new BadRequestException('El cuarto ya está ocupado');
  }

  return this.prisma.dressingroom.update({
    where: { id: roomId },
    data: {
      status: 'OCCUPIED',
      occupantName: dto.occupantName,
      // …rest of the update
    },
  });
}

  async vacateRoom(roomId: string) {
    return this.prisma.dressingroom.update({
      where: { id: roomId },
      data: {
        status: 'FREE',
        occupantName: null,
        notes: null,
        occupiedAt: null,
      },
    });
  }
}