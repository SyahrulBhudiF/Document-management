import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { envConfig } from '../../../config/env.config';
import { v4 as uuidv4 } from 'uuid';
import { WinstonLogger } from '../../logger/logger.service';

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
    private readonly logger: WinstonLogger,
  ) {}

  /**
   * Generates an access token for the user.
   *
   * @param userInfo - The user information to include in the token payload.
   */
  async generateAccessToken(
    userInfo: Omit<UserJwtPayload, 'jti'>,
  ): Promise<string> {
    const jti = uuidv4();
    const payloadWithJti: UserJwtPayload = { ...userInfo, jti };

    this.logger.log(
      `Generated access token for user ${userInfo.email}`,
      'AuthService',
    );

    return this.jwtService.signAsync(payloadWithJti, {
      secret: envConfig.JWT_ACCESS_SECRET,
      expiresIn: `${envConfig.ACCESS_TOKEN_EXPIRES_IN}h`,
    });
  }

  /**
   * Generates a refresh token for the user.
   *
   * @param userInfo - The user information to include in the token payload.
   */
  async generateRefreshToken(
    userInfo: Omit<UserJwtPayload, 'jti'>,
  ): Promise<string> {
    const jti = uuidv4();
    const payloadWithJti: UserJwtPayload = { ...userInfo, jti };

    this.logger.log(
      `Generated refresh token for user ${userInfo.email}`,
      'AuthService',
    );

    return await this.jwtService.signAsync(payloadWithJti, {
      secret: envConfig.JWT_REFRESH_SECRET,
      expiresIn: `${envConfig.REFRESH_TOKEN_EXPIRES_IN}d`,
    });
  }

  /**
   * Verifies the access token and returns the payload.
   *
   * @param payload
   */
  async blacklistTokenFromPayload(payload: UserJwtPayload): Promise<void> {
    if (!payload.jti) {
      this.logger.error(
        'Token is missing JTI and cannot be reliably checked against blacklist.',
        'AuthService',
      );
      return;
    }

    const key = `bl_${payload.sub}_${payload.jti}`;
    const maxTokenLifeInSeconds = Math.max(
      envConfig.ACCESS_TOKEN_EXPIRES_IN * 3600,
      envConfig.REFRESH_TOKEN_EXPIRES_IN * 24 * 3600,
    );

    await this.cacheManager.set(key, true, maxTokenLifeInSeconds * 1000);
    this.logger.log(`Blacklisted token for user ${payload.sub}`, 'AuthService');
  }
}
