import { Controller, Get, Post, Body, Param, Patch, Req } from '@nestjs/common';
import { DjSessionService } from './dj-session.service';

@Controller('dj')
export class DjSessionController {
  constructor(private readonly djSessionService: DjSessionService) {}

  @Get('queue/:sessionId')
  getQueue(@Param('sessionId') sessionId: string) {
    return this.djSessionService.getQueue(sessionId);
  }

  @Get('start/:tenantId')
  startSession(@Param('tenantId') tenantId: string) {
    return this.djSessionService.createSession(tenantId);
  }

  @Post('request')
  async createRequest(
    @Body() body: { songTitle: string; artistName: string; isPriority: boolean }
  ) {
    const sessionId = 'demo-session-id';
    return this.djSessionService.createRequest(body, sessionId);
  }

  @Post('vote')
  async vote(@Body() body: { requestId: string, userId: string, tenantId?: string }, @Req() req: any ) {
     console.log(`🔴 [BACKEND] Recibiendo voto. User: ${body.userId}, Request: ${body.requestId}`);
    const tenantId = req.user?.tenantId || body.tenantId || 'cmm62yunu00006pk1u2y2y286'; 
    return this.djSessionService.vote(body.userId, body.requestId, tenantId);
  }

  @Patch('request/:id')
  async updateStatus(
    @Param('id') id: string, 
    @Body() body: { status: string }
  ) {
    return this.djSessionService.updateStatus(id, body.status);
  }
}