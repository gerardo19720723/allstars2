import { Module } from '@nestjs/common';
import { CloakroomController } from './cloakroom.controller';
import { CloakroomService } from './cloakroom.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DjSessionModule } from '../../dj-session/dj-session.module'; // Importamos para Sockets

@Module({
  imports: [DjSessionModule],
  controllers: [CloakroomController],
  providers: [CloakroomService, PrismaService],
  exports: [CloakroomService],
})
export class CloakroomModule {}