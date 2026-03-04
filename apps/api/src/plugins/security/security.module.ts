import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [SecurityController],
  providers: [SecurityService, PrismaService],
})
export class SecurityModule {}