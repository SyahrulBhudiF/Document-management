import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule as JWT } from '@nestjs/jwt';
import { AccessTokenStrategy } from './strategy/access-token.strategy';
import { RefreshTokenStrategy } from './strategy/refresh-token.strategy';
import { AccessTokenGuard } from './guard/access-token.guard';
import { RefreshTokenGuard } from './guard/refresh-token.guard';
import { JwtService } from './service/jwt.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [PassportModule, JWT.register({}), LoggerModule],
  providers: [
    JwtService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AccessTokenGuard,
    RefreshTokenGuard,
  ],
  exports: [JwtService, AccessTokenGuard, RefreshTokenGuard, JwtModule],
})
export class JwtModule {}
