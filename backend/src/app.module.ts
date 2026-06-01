import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PatientModule } from './patient/patient.module';
import { AppointmentModule } from './appointment/appointment.module';
import { ConsultationModule } from './consultation/consultation.module';
import { DetoxsessionModule } from './detoxsession/detoxsession.module';

@Module({
   imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }), AuthModule, AdminModule, PatientModule, AppointmentModule, ConsultationModule, DetoxsessionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
