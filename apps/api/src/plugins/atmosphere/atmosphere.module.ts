import { Module } from '@nestjs/common';
import { AtmosphereService } from './atmosphere.service';
import { AtmosphereController } from './atmosphere.controller';

@Module({
  controllers: [AtmosphereController],
  providers: [AtmosphereService],
  exports: [AtmosphereService],
})
export class AtmosphereModule {}