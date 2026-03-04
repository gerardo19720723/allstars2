import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  async reportIncident(tenantId: string, dto: any) {
    return this.prisma.security.create({ // Nota: es 'security'
      data: {
        tenantId,
        type: dto.type,
        description: dto.description,
        location: dto.location,
        priority: dto.priority || 'MEDIUM',
        reportedBy: dto.reportedBy,
      },
    });
  }

  resolveIncident(id: string) {
    return this.prisma.security.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  getActiveIncidents(tenantId: string) {
    return this.prisma.security.findMany({
      where: { tenantId, status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });
  }
}