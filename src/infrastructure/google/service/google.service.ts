import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { WinstonLogger } from '../../logger/logger.service';
import { User } from '../../../config/db/schema';
import { DatabaseService } from '../../database/database.service';
import { usersTable } from '../../../config/db/schema';
import { v4 } from 'uuid';
import { envConfig } from '../../../config/env.config';

interface OAuthUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  providerId: string;
}

@Injectable()
export class GoogleService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly logger: WinstonLogger,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Validates the OAuth login for a user.
   *
   * @param user
   */
  async validateOAuthLogin(user: OAuthUser): Promise<Partial<User>> {
    const newUser = {
      id: v4(),
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      emailVerified: new Date(),
      loginAt: new Date(),
    };

    const result = await this.db.dbConfig
      .insert(usersTable)
      .values(newUser)
      .onConflictDoUpdate({
        target: usersTable.email,
        set: {
          name: newUser.name,
          emailVerified: newUser.emailVerified,
          loginAt: newUser.loginAt,
        },
      })
      .returning();

    await this.cacheManager.set(
      result[0].id,
      JSON.stringify(result[0]),
      envConfig.ACCESS_TOKEN_EXPIRES_IN * 60 * 60 * 1000,
    );
    this.logger.log(
      `User ${result[0].name} with email ${result[0].email} logged in successfully`,
      'GoogleService',
    );

    return result[0];
  }
}
