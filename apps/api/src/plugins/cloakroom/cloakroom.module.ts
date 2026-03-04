import { Module } from '@nestjs/common';
import { CloakroomController } from './cloakroom.controller';
import { CloakroomService } from './cloakroom.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CloakroomController],
  providers: [CloakroomService, PrismaService],
})
export class CloakroomModule {}