import { Module } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DjSessionModule } from '../dj-session/dj-session.module'; // Para tener acceso al Gateway

@Module({
  imports: [PrismaModule, DjSessionModule],
  controllers: [GenreController],
  providers: [GenreService],
  exports: [GenreService],
})
export class GenreModule {}