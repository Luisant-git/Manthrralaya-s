import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
   imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }), AuthModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
