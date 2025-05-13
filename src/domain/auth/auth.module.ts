import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './service/auth.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { LoggerModule } from '../../infrastructure/logger/logger.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { GoogleModule } from '../../infrastructure/google/google.module';
import { JwtModule } from '../../infrastructure/jwt/jwt.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [DatabaseModule, LoggerModule, JwtModule, MailModule, GoogleModule],
})
export class AuthModule {}
