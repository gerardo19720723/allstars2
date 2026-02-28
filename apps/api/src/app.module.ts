import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { OrderModule } from './order/order.module';
import { DoorModule } from './door/door.module';
import { DjSessionModule } from './dj-session/dj-session.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MenuModule,
    OrderModule,
    DoorModule,
    DjSessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
