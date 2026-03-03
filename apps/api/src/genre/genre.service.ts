import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DjGateway } from '../dj-session/gateways/dj.gateway';

// 👇 IMPORTANTE: Asegúrate de que esté esto arriba
@Injectable() 
export class GenreService { // 👇 IMPORTANTE: Debe decir 'export class'
  constructor(
    private prisma: PrismaService,
    private djGateway: DjGateway,
  ) {}

  // 1. INICIAR UNA NUEVA BATALLA
  async startBattle(tenantId: string, genreIds: string[]) {
    // Cerrar batallas anteriores activas de este tenant
    await this.prisma.genreSession.updateMany({
      where: { tenantId, isActive: true },
      data: { isActive: false },
    });

    // Crear nueva sesión de batalla
    const session = await this.prisma.genreSession.create({
      data: {
        tenantId,
        isActive: true,
      },
    });

    // Notificar al Frontend que empezó la batalla
    this.djGateway.server.emit('battleStarted', { sessionId: session.id, genreIds });
    
    return session;
  }

  // 2. VOTAR POR UN GÉNERO
  async voteGenre(customerId: string, genreId: string, tenantId: string) {
    // A. Asegurar que el cliente existe
    await this.prisma.customer.upsert({
      where: { id: customerId },
      update: {},
      create: { id: customerId, tenantId, points: 0 },
    });

    // B. Buscar la sesión activa
    const session = await this.prisma.genreSession.findFirst({
      where: { tenantId, isActive: true },
    });

    if (!session) {
      throw new ConflictException('No hay batalla activa en este momento.');
    }

    // C. Registrar el voto
    const vote = await this.prisma.genreVote.create({
      data: {
        customerId,
        genreId,
        sessionId: session.id,
      },
    });

    // D. Notificar resultados actualizados en tiempo real
    const results = await this.getResults(tenantId);
    this.djGateway.server.emit('battleUpdated', results);

    return vote;
  }

  // 3. OBTENER RESULTADOS ACTUALES
  async getResults(tenantId: string) {
    const session = await this.prisma.genreSession.findFirst({
      where: { tenantId, isActive: true },
    });

    if (!session) return [];

    // Contar votos por género
    const votes = await this.prisma.genreVote.groupBy({
      by: ['genreId'],
      where: { sessionId: session.id },
      _count: { genreId: true },
    });

    const genreIds = votes.map(v => v.genreId);
    const genres = await this.prisma.genre.findMany({
      where: { id: { in: genreIds } },
    });

    return genres.map(g => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji,
      votes: votes.find(v => v.genreId === g.id)?._count.genreId || 0,
    }));
  }

    // 4. TERMINAR BATALLA
  async endBattle(tenantId: string) {
    // Cerrar todas las sesiones activas para este tenant
    await this.prisma.genreSession.updateMany({
      where: { tenantId, isActive: true },
      data: { isActive: false },
    });

    // Notificar a todos los clientes para que vuelvan a la pantalla normal
    this.djGateway.server.emit('battleEnded');
  }
}