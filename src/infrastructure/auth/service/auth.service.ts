import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { envConfig } from '../../../config/env.config';
import { v4 as uuidv4 } from 'uuid';

export interface UserJwtPayload {
  sub: string;
  name: string;
  email: string;
  jti?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async generateAccessToken(
    userInfo: Omit<UserJwtPayload, 'jti'>,
  ): Promise<string> {
    const jti = uuidv4();
    const payloadWithJti: UserJwtPayload = { ...userInfo, jti };
    return this.jwtService.signAsync(payloadWithJti, {
      secret: envConfig.JWT_ACCESS_SECRET,
      expiresIn: `${envConfig.ACCESS_TOKEN_EXPIRES_IN}h`,
    });
  }

  async generateRefreshToken(
    userInfo: Omit<UserJwtPayload, 'jti'>,
  ): Promise<string> {
    const jti = uuidv4();
    const payloadWithJti: UserJwtPayload = { ...userInfo, jti };

    return await this.jwtService.signAsync(payloadWithJti, {
      secret: envConfig.JWT_REFRESH_SECRET,
      expiresIn: `${envConfig.REFRESH_TOKEN_EXPIRES_IN}d`,
    });
  }

  async verifyTokenAndCheckBlacklist(
    token: string,
    secret: string,
  ): Promise<UserJwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<UserJwtPayload>(token, {
        secret: secret,
      });

      const isBlacklisted = await this.cacheManager.get(
        `bl_${payload.sub}_${payload.jti}`,
      );

      if (isBlacklisted) {
        throw new UnauthorizedException('Token is blacklisted');
      }

      return payload;
    } catch (error: any) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message);
      }
      throw new UnauthorizedException('Invalid token or unknown error');
    }
  }

  async blacklistTokenFromPayload(payload: UserJwtPayload): Promise<void> {
    if (!payload.jti) {
      console.warn(
        'Attempted to blacklist token without JTI. Consider adding JTI to JWTs for effective blacklisting.',
      );
      return;
    }

    const key = `bl_${payload.sub}_${payload.jti}`;
    const maxTokenLifeInSeconds = Math.max(
      envConfig.ACCESS_TOKEN_EXPIRES_IN * 3600,
      envConfig.REFRESH_TOKEN_EXPIRES_IN * 24 * 3600,
    );

    await this.cacheManager.set(key, true, maxTokenLifeInSeconds * 1000);
    console.log(`Token blacklisted: ${key}`);
  }
}
