import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './service/auth.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { LoggerModule } from '../../infrastructure/logger/logger.module';
import { MailModule } from '../../infrastructure/mail/mail.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [DatabaseModule, LoggerModule, AuthModule, MailModule],
})
export class AuthModule {}
