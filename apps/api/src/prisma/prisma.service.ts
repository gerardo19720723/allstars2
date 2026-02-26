import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    // Se conecta cuando arranca la app
    await this.$connect();
  }

  async onModuleDestroy() {
    // Se desconecta cuando se apaga la app
    await this.$disconnect();
  }
}