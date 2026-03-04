import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { DjGateway } from '../../dj-session/gateways/dj.gateway';

@Injectable()
export class ValetService {
  constructor(
    private prisma: PrismaService,
    private djGateway: DjGateway,
  ) {}

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
  async assignSpot(tenantId: string, spotId: string, customerId?: string) {
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
    
    // 2.5 Asegurar que el cliente existe en la BD (Upsert)
    if (customerId) {
      await this.prisma.customer.upsert({
        where: { id: customerId },
        update: {}, // Si existe, no hacer nada
        create: {
          id: customerId,
          tenantId: tenantId,
          points: 0,
        },
      });
      console.log(`✅ [VALET] Cliente ${customerId} listo en BD.`);
    }

    // 3. Transacción: Crear Ticket Y Actualizar Spot al mismo tiempo
    const [newTicket] = await this.prisma.$transaction([
      // Operación A: Crear el ticket
      this.prisma.valetTicket.create({
        data: {
          ticketCode,
          spotId,
          tenantId,
          status: 'ACTIVE',
          customerId: customerId || null, 
        },
        include: { spot: true },
      }),
      // Operación B: Actualizar el cajón a Ocupado (ESTO FALTABA)
      this.prisma.valetSpot.update({
        where: { id: spotId },
        data: { status: 'OCCUPIED' },
      }),
    ]);

    // --- 🪄 MAGIA WEBSOCKET: ENVIAR AL CLIENTE ---
    if (customerId) {
      // VERIFICACIÓN DE SEGURIDAD: ¿Existe el servidor de sockets?
      if (this.djGateway && this.djGateway.server) {
        console.log(`📡 [VALET SERVICE] Enviando ticket al cliente ID: ${customerId}`);
        this.djGateway.server.emit(`ticket:${customerId}`, newTicket);
        console.log('✅ [VALET SERVICE] Enviado con éxito');
      } else {
        console.warn('⚠️ [VALET SERVICE] Servidor de Sockets no disponible. Ticket creado, pero notificación fallida.');
      }
    }
    // ----------------------------------------------

    return newTicket;
  }

  /**
   * CLIENTE: Vincula un ticket a su cuenta.
   * El usuario escanea o escribe el código del ticket.
   */
  async claimTicket(customerId: string, ticketCode: string, tenantId: string) {
    // 1. Buscar el ticket activo y que no tenga dueño (o que sea el mismo dueño)
    const ticket = await this.prisma.valetTicket.findFirst({
      where: { 
        ticketCode, 
        tenantId, 
        status: 'ACTIVE' 
      },
      include: { spot: true }
    });

    if (!ticket) {
      throw new BadRequestException('Código de ticket inválido, expirado o inexistente');
    }

    // Opcional: Si el ticket ya tiene dueño y es otro usuario, bloquear
    if (ticket.customerId && ticket.customerId !== customerId) {
      throw new BadRequestException('Este ticket ya está vinculado a otro usuario');
    }

    // 2. Vincular o Devolver información si ya estaba vinculado
    if (!ticket.customerId) {
      const updated = await this.prisma.valetTicket.update({
        where: { id: ticket.id },
        data: { customerId: customerId },
        include: { spot: true }
      });
      return updated;
    }

    return ticket; // Ya estaba vinculado, devolvemos los datos
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
      include: { spot: true } // Importante: tener el spot para actualizarlo
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

    // --- NUEVO: AVISAR AL CLIENTE QUE EL AUTO ESTÁ LISTO ---
    if (this.djGateway && this.djGateway.server && ticket.customerId) {
      console.log(`🚗 [EXIT] Notificando al cliente ${ticket.customerId}`);
      this.djGateway.server.emit(`ticket_returned:${ticket.customerId}`, {
        message: "Tu vehículo ha sido entregado."
      });
    }
    // ----------------------------------------------------

    return { success: true, exitTime: now };
  }

    /**
   * CLIENTE: Solicita que le traigan el auto.
   * Envia alerta al Staff via WebSockets.
   */
  async requestCar(ticketCode: string, tenantId: string) {
    // 1. Verificar que el ticket existe y está activo
    const ticket = await this.prisma.valetTicket.findFirst({
      where: { 
        ticketCode, 
        tenantId, 
        status: 'ACTIVE' 
      },
      include: { spot: true }
    });

    if (!ticket) {
      throw new BadRequestException('Ticket no válido o expirado');
    }

    // 2. Enviar alerta a TODOS los Staff conectados (o al Room de staff)
    // Usamos el mismo DjGateway
    if (this.djGateway && this.djGateway.server) {
      console.log(`🚗 [ALERTA] Cliente solicitando auto en cajón ${ticket.spot.number}`);
      this.djGateway.server.emit('staff_alert_request', {
        spotId: ticket.spotId,
        spotNumber: ticket.spot.number,
        message: `Cliente solicitando auto en cajón ${ticket.spot.number}`
      });
    }

    return { success: true, spotNumber: ticket.spot.number };
  }
}