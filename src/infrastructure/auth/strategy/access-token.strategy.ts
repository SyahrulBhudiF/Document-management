import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envConfig } from '../../../config/env.config';
import { AuthService, UserJwtPayload } from '../service/auth.service'; // Added AuthService import
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: envConfig.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: UserJwtPayload): Promise<UserJwtPayload> {
    if (!payload.jti) {
      throw new UnauthorizedException(
        'Token is missing JTI and cannot be reliably checked against blacklist.',
      );
    }

    const cacheKey = `bl_${payload.sub}_${payload.jti}`;
    const isBlacklisted = await this.authService['cacheManager'].get(cacheKey);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been blacklisted.');
    }
    return payload;
  }
}
