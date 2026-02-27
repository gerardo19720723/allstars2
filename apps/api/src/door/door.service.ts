import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';
import { DoorGateway } from './gateways/door.gateway';

@Injectable()
export class DoorService {
  private readonly MAX_CAPACITY = 500; // Capacidad fija para el MVP

  constructor(
    private prisma: PrismaService,
    private doorGateway: DoorGateway
  ) {}

  async checkIn(dto: CheckInDto, tenantId: string) {
    const { identifier } = dto;

    // 1. Buscar en lista de invitados
    const guestListEntry = await this.prisma.guestList.findFirst({
      where: {
        tenantId,
        OR: [
          { name: identifier },
          { note: identifier }
        ]
      }
    });

    // 2. Determinar tipo de entrada
    let guestData: any = {
      tenantId,
      name: 'Walk-in',
      ticketType: 'GENERAL',
      status: 'CHECKED_IN'
    };

    if (guestListEntry) {
      guestData = {
        tenantId,
        name: guestListEntry.name,
        ticketType: guestListEntry.isVip ? 'VIP' : 'RESERVATION',
        status: 'CHECKED_IN'
      };
    }

    // 3. Verificar capacidad si es Walk-in
    if (!guestListEntry) {
      const activeGuests = await this.prisma.guest.count({
        where: { tenantId, status: 'CHECKED_IN' }
      });

      if (activeGuests >= this.MAX_CAPACITY) {
        // Crear registro denegado
        const deniedGuest = await this.createGuest(
          { ...guestData, status: 'DENIED' },
          'Aforo lleno'
        );
        
        // Emitir actualización de aforo (sigue lleno)
        this.doorGateway.notifyCapacityUpdate({
          active: this.MAX_CAPACITY,
          max: this.MAX_CAPACITY,
          available: 0
        });

        throw new BadRequestException('DENIED: Aforo lleno');
      }
    }

    // 4. Crear el Guest y Log (Aprobado)
    const guest = await this.createGuest(guestData);

    // 5. Calcular nuevo aforo para emitir
    const newActiveGuests = await this.prisma.guest.count({
      where: { tenantId, status: 'CHECKED_IN' }
    });

    // 6. Emitir actualización WEBSOCKET
    this.doorGateway.notifyCapacityUpdate({
      active: newActiveGuests,
      max: this.MAX_CAPACITY,
      available: this.MAX_CAPACITY - newActiveGuests
    });

    return guest;
  }

  // Método auxiliar privado
  private async createGuest(data: any, reason?: string) {
    const guest = await this.prisma.guest.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        ticketType: data.ticketType,
        status: data.status
      }
    });

    // Crear log de acceso
    await this.prisma.accessLog.create({
      data: {
        tenantId: data.tenantId,
        guestId: guest.id,
        action: data.status,
        reason: reason
      }
    });

    return guest;
  }

  async getCapacity(tenantId: string) {
    const active = await this.prisma.guest.count({
      where: { tenantId, status: 'CHECKED_IN' }
    });

    return {
      active,
      max: this.MAX_CAPACITY,
      available: this.MAX_CAPACITY - active
    };
  }
}