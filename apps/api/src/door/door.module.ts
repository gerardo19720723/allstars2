import { Module } from '@nestjs/common';
import { DoorService } from './door.service';
import { DoorController } from './door.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DoorGateway } from './gateways/door.gateway';

@Module({
  imports:[
    PrismaModule,
  ],
  controllers: [DoorController],
  providers: [DoorService, DoorGateway],
})
export class DoorModule {}
