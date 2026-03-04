import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { OrderModule } from './order/order.module';
import { DoorModule } from './door/door.module';
import { DjSessionModule } from './dj-session/dj-session.module';
import { GenreModule } from './genre/genre.module';
import { CustomerModule } from './customer/customer.module';
import { AtmosphereModule } from './plugins/atmosphere/atmosphere.module';
import { AiModule } from './plugins/ai/ai.module';
import { LoyaltyModule } from './plugins/loyalty/loyalty.module';
import { ValetModule } from './plugins/valet/valet.module';
import { CloakroomModule } from './plugins/cloakroom/cloakroom.module';
import { SecurityModule } from './plugins/security/security.module';
import { DressingroomModule } from './plugins/dressingroom/dressingroom.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MenuModule,
    OrderModule,
    DoorModule,
    DjSessionModule,
    GenreModule,
    CustomerModule,
    AtmosphereModule,
    AiModule,
    LoyaltyModule,
    ValetModule,
    CloakroomModule,
    SecurityModule,
    DressingroomModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
