import { Global, Module } from '@nestjs/common';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';

@Global()
@Module({
  imports: [LoggerModule, AuthModule],
  exports: [LoggerModule, AuthModule],
})
export class InfrastructureModule {}
