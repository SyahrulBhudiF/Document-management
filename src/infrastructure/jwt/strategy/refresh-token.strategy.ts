import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { envConfig } from '../../../config/env.config';
import { JwtService, UserJwtPayload } from '../service/jwt.service';
import { UnauthorizedException } from '@nestjs/common';

interface RequestWithRefreshTokenBody extends Request {
  body: {
    refresh_token?: string;
  };
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly jwt: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: RequestWithRefreshTokenBody) => req.body?.refresh_token ?? null,
      ]),
      secretOrKey: envConfig.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(
    req: RequestWithRefreshTokenBody,
    payload: UserJwtPayload,
  ): Promise<UserJwtPayload & { refreshToken: string }> {
    const refreshToken = req.body?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token not found in request body',
      );
    }

    if (!payload.jti) {
      throw new UnauthorizedException(
        'Refresh token is missing JTI and cannot be reliably checked against blacklist.',
      );
    }

    const cacheKey = `bl_${payload.sub}_${payload.jti}`;
    const isBlacklisted = await this.jwt['cacheManager'].get(cacheKey);

    if (isBlacklisted) {
      throw new UnauthorizedException('Refresh token has been blacklisted.');
    }

    return { ...payload, refreshToken };
  }
}
