import { ConfigModule } from '@nestjs/config';
import { CustomConfigModule } from './config/custom-config.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomersModule } from './customers/customers.module';
import { AuditTrailModule } from './audit-trail/audit-trail.module';
import { AlternateAuthenticationService } from './utils/alt-authentication';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    CustomConfigModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CustomersModule,
    AuditTrailModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AlternateAuthenticationService],
})
export class AppModule {}
