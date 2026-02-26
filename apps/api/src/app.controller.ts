import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard) // <--- Solo entra quien tenga token válido
  @Get('profile')
  getProfile(@Request() req) {
    // req.user viene de la función validate() en JwtStrategy
    return req.user; 
  }
}
