import { Controller, Post, Body } from '@nestjs/common';
import { AtmosphereService } from './atmosphere.service';

@Controller('atmosphere')
export class AtmosphereController {
  constructor(private readonly atmosphereService: AtmosphereService) {}

  @Post('lights')
  async controlLights(@Body() body: { color: string; intensity: number }) {
    return this.atmosphereService.setLights(body.color, body.intensity);
  }
}