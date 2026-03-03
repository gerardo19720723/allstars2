import { Module } from '@nestjs/common';
import { DjSessionService } from './dj-session.service';
import { DjSessionController } from './dj-session.controller';
import { DjGateway } from './gateways/dj.gateway';
//import { UserModule } from '../user/user.module';

@Module({
  imports: [
 // UserModule,
  ],
  controllers: [DjSessionController],
  providers: [DjSessionService, DjGateway],
  exports: [DjGateway],
})
export class DjSessionModule {}
