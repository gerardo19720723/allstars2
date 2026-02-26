import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // 1. De dónde sacamos el token? -> Del Header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 2. Ignorar expiración del token? -> NO (si expira, da error 401)
      ignoreExpiration: false,
      // 3. Cuál es la clave secreta para desencriptar? -> La del .env
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  // 4. Qué devolvemos si el token es válido?
  // Esto estará disponible en el Request como 'req.user'
  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, tenantId: payload.tenantId};
  }
}