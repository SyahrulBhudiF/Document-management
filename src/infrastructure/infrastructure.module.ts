import { Global, Module } from '@nestjs/common';
import { LoggerModule } from './logger/logger.module';
import { JwtModule } from './jwt/jwt.module';
import { MailModule } from './mail/mail.module';

@Global()
@Module({
  imports: [LoggerModule, JwtModule, MailModule],
  exports: [LoggerModule, JwtModule, MailModule],
})
export class InfrastructureModule {}
