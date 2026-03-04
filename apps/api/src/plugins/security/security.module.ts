import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DjSessionModule } from '../../dj-session/dj-session.module';

@Module({
  imports: [DjSessionModule],
  controllers: [SecurityController],
  providers: [SecurityService, PrismaService],
})
export class SecurityModule {}