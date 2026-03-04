import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DjGateway } from '../../dj-session/gateways/dj.gateway';

@Injectable()
export class SecurityService {
  constructor(
    private prisma: PrismaService,
    private djGateway: DjGateway,
  ) {}

  async reportIncident(tenantId: string, data: {
    type: string; // FIGHT, THEFT, DRUNK, MEDICAL
    description: string;
    location: string;
    priority: string; // HIGH, MEDIUM, LOW
    reportedBy?: string;
  }) {
    const incident = await this.prisma.security.create({
      data: {
        tenantId,
        ...data,
        status: 'OPEN',
      },
    });

    // Enviar alerta a TODOS los Staff conectados
    if (this.djGateway && this.djGateway.server) {
      this.djGateway.server.emit('security_alert', incident);
    }

    return incident;
  }

  async resolveIncident(id: string) {
    const resolved = await this.prisma.security.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });

    // Notificar que se resolvió
    if (this.djGateway && this.djGateway.server) {
      this.djGateway.server.emit('security_resolved', { id: resolved.id });
    }

    return resolved;
  }

  async getActiveIncidents(tenantId: string) {
    return this.prisma.security.findMany({
      where: { tenantId, status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });
  }
}