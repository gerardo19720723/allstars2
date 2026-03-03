import { Controller, Post, Body, Get, Req, Query } from '@nestjs/common';
import { GenreService } from './genre.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('genre')
export class GenreController {
  constructor(
    private readonly genreService: GenreService,
    private prisma: PrismaService
  ) {}

  @Get('list')
  async list(@Req() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.prisma.genre.findMany({ where: { tenantId } });
  }

  @Post('start-battle')
  startBattle(@Body() body: { genreIds: string[] }, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.genreService.startBattle(tenantId, body.genreIds);
  }

  @Post('vote')
  async vote(@Body() body: { genreId: string, userId: string }, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.genreService.voteGenre(body.userId, body.genreId, tenantId);
  }

  @Get('results')
  async getResults(@Req() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.genreService.getResults(tenantId);
  }

    @Post('end-battle')
  endBattle(@Req() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.genreService.endBattle(tenantId);
  }
}