import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('El usuario ya existe');
    }

    // 2. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        tenantId: dto.tenantId,
      },
    });

    // 4. Retornar token (Login automático tras registro)
    return this.signToken(user.id, user.email, user.tenantId);
  }

  async login(dto: LoginDto) {
    // 1. Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    // 2. Comparar contraseña
    const isValid = await bcrypt.compare(dto.password, user.password);

    if (!isValid) throw new UnauthorizedException('Credenciales incorrectas');

    // 3. Retornar token
    return this.signToken(user.id, user.email, user.tenantId);
  }

  private async signToken(userId: string, email: string, tenantId: string) {
    const payload = { 
      sub: userId, 
      email: email,
      tenantId: tenantId
     };
    const token = await this.jwtService.signAsync(payload);

    return { access_token: token };
  }
}