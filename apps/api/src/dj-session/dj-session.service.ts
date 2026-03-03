import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DjGateway } from './gateways/dj.gateway';

// Interface para la creación de peticiones
interface CreateRequestDto {
  songTitle: string;
  artistName: string;
  isPriority: boolean;
  tenantId?: string;
}

@Injectable()
export class DjSessionService {
  constructor(
    private prismaService: PrismaService,
    private djGateway: DjGateway,
  ) {}

  /**
   * REGISTRA UN VOTO DE UN CLIENTE
   * 1. Crea/Actualiza el Cliente (Fidelización).
   * 2. Verifica que no haya votado antes.
   * 3. Crea el voto, suma puntos al cliente y suma votos a la canción en una transacción.
   * 4. Notifica al DJ y al Cliente (NUEVO).
   */
  async vote(customerId: string, requestId: string, tenantId: string) {
    // 1. Asegurar que el cliente existe (Upsert en tabla Customer)
    await this.prismaService.customer.upsert({
      where: { id: customerId },
      update: {},
      create: {
        id: customerId,
        tenantId: tenantId,
        points: 0,
      },
    });

    // 2. Verificar si ya votó (Check en tabla CustomerVote)
    const existingVote = await this.prismaService.customerVote.findUnique({
      where: {
        requestId_customerId: {
          requestId,
          customerId,
        },
      },
    });

    if (existingVote) {
      throw new ConflictException('Ya has votado por esta canción');
    }

    // 3. Ejecutar Transacción (Todo o nada)
    // IMPORTANTE: Capturamos el resultado del customerUpdate para tener los puntos nuevos
    const [vote, updatedCustomer, song] = await this.prismaService.$transaction([
      // A. Crear el registro del voto en CustomerVote
      this.prismaService.customerVote.create({
        data: {
          requestId,
          customerId,
        },
      }),
      // B. Sumar 1 punto de fidelización al Cliente
      this.prismaService.customer.update({
        where: { id: customerId },
        data: {
          points: { increment: 1 }
        },
      }),
      // C. Incrementar el contador de votos en la canción (SongRequest)
      this.prismaService.songRequest.update({
        where: { id: requestId },
        data: {
          votes: { increment: 1 }
        }
      })
    ]);

    // 4. Obtener la sesión para notificar
    const request = await this.prismaService.songRequest.findUnique({
      where: { id: requestId }
    });

    if (request) {
      // 5. Notificar a todos los clientes conectados (Dashboard DJ)
      this.djGateway.notifyQueueUpdate(await this.getQueue(request.sessionId));
    }

    // --- NUEVO: Notificar al Cliente sus puntos actualizados ---
    if (updatedCustomer) {
      this.djGateway.server.emit('pointsUpdated', { 
        customerId: customerId, 
        points: updatedCustomer.points 
      });
    }

    return { success: true, message: 'Voto registrado' };
  }

  /**
   * Obtiene la cola de canciones ORDENADA por algoritmo de ranking.
   * ORDEN: Playing Now (Verde) -> PENDING (Ordenadas por Ranking de Votos)
   * Las PLAYED no se muestran (se eliminan de la vista).
   */
  async getQueue(sessionId: string) {
    // 1. TRAER TANTO 'PLAYING' COMO 'PENDING'
    const requests = await this.prismaService.songRequest.findMany({
      where: { 
        sessionId,
        status: { in: ['PLAYING', 'PENDING'] } 
      },
      orderBy: { createdAt: 'asc' } 
    });

    // 2. Separar listas
    const playingNow = requests.filter(r => r.status === 'PLAYING');
    const pending = requests.filter(r => r.status === 'PENDING');

    // 3. Aplicar algoritmo de Ranking SOLO a los pendientes
    const rankedPending = pending.map(req => {
      let score = 0;
      // A. Votos (+10 puntos cada uno)
      score += req.votes * 10;
      // B. Donación/Prioridad (+1000 puntos)
      if (req.isPriority) score += 1000;
      // C. Factor Antigüedad
      const timeInQueue = Date.now() - new Date(req.createdAt).getTime();
      score -= Math.floor(timeInQueue / 100000);
      
      return { ...req, score };
    });

    rankedPending.sort((a, b) => b.score - a.score);

    // 4. Retornar: Primero la que suena, luego las ordenadas
    return [...playingNow, ...rankedPending];
  }

  async createRequest(data: CreateRequestDto, sessionId: string) {
    // 1. VERIFICAR SI LA SESIÓN EXISTE
    let session = await this.prismaService.djSession.findUnique({
      where: { id: sessionId }
    });

    // 2. SI NO EXISTE, CREARLA AUTOMÁTICAMENTE
    if (!session) {
      console.log(`La sesión ${sessionId} no existe. Creándola automáticamente...`);
      session = await this.prismaService.djSession.create({
        data: {
          id: sessionId, 
          tenantId: data.tenantId || 'default-tenant', 
          isActive: true
        }
      });
    }

    // 3. CREAR LA PETICIÓN
    const request = await this.prismaService.songRequest.create({
      data: {
        sessionId: session.id,
        songUri: 'spotify:track:placeholder',
        songTitle: data.songTitle,
        artistName: data.artistName,
        status: 'PENDING',
        isPriority: data.isPriority,
        votes: 0
      }
    });

    // 4. NOTIFICAR AL DJ
    this.djGateway.notifyQueueUpdate(await this.getQueue(session.id));

    return request;
  }

  /**
   * Cambia el estado de una canción (PLAY, SKIP, etc.)
   */
  async updateStatus(id: string, status: string) {
    const updateData: any = { status };
    
    // Si se reproduce, marcamos la hora
    if (status === 'PLAYED') {
      updateData.playedAt = new Date();
    }

    const updatedRequest = await this.prismaService.songRequest.update({
      where: { id },
      data: updateData
    });

    // Notificar al DJ el cambio en la lista
    this.djGateway.notifyQueueUpdate(await this.getQueue(updatedRequest.sessionId));

    return updatedRequest;
  }

  /**
   * Crea una nueva sesión DJ (Opcional, para arranque o cambio de DJ).
   */
  async createSession(tenantId: string) {
    const session = await this.prismaService.djSession.create({
      data: {
        tenantId,
        isActive: true
      }
    });
    return session;
  }
}