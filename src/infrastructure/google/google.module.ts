import { Module } from '@nestjs/common';
import { GoogleStrategy } from './strategy/google.strategy';
import { PassportModule } from '@nestjs/passport';
import { GoogleAuthGuard } from './guard/google.guard';
import { GoogleService } from './service/google.service';
import { LoggerModule } from '../logger/logger.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'google' }),
    LoggerModule,
    DatabaseModule,
  ],
  providers: [GoogleStrategy, GoogleAuthGuard, GoogleService],
  exports: [GoogleAuthGuard, GoogleService],
})
export class GoogleModule {}
