import { Injectable } from '@nestjs/common';

@Injectable()
export class AtmosphereService {
  
  // TODO: Conectar con API de Philips Hue / LIFX
  async setLights(color: string, intensity: number) {
    console.log(`[Atmosphere] Setting lights to ${color} at ${intensity}%`);
    return { status: 'success', color, intensity };
  }

  // TODO: Sincronizar con música
  async syncWithMusic(bpm: number) {
    console.log(`[Atmosphere] Syncing lights to BPM: ${bpm}`);
    return { status: 'synced', bpm };
  }
}