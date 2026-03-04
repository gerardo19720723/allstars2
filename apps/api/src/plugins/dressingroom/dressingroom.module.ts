import { Module } from '@nestjs/common';
import { DressingroomController } from './dressingroom.controller';
import { DressingroomService } from './dressingroom.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [DressingroomController],
  providers: [DressingroomService, PrismaService],
  exports: [DressingroomService],
})
export class DressingroomModule {}