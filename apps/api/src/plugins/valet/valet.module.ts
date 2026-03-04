import { Module } from '@nestjs/common';
import { ValetController } from './valet.controller';
import { ValetService } from './valet.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ValetController],
  providers: [ValetService, PrismaService],
  exports: [ValetService],
})
export class ValetModule {}