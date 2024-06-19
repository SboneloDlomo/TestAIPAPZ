import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import orgManagerConfig from './org-manager.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [orgManagerConfig],
      isGlobal: true,
    }),
  ],
})
export class CustomConfigModule {}
