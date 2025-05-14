import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { User, usersTable } from '../../../config/db/schema';
import { Cache } from 'cache-manager';
import { envConfig } from '../../../config/env.config';
import { NotFoundException } from '@nestjs/common/exceptions';
import { eq } from 'drizzle-orm';
import { WinstonLogger } from '../../../infrastructure/logger/logger.service';

@Injectable()
export class UserUtilService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: WinstonLogger,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Retrieves the profile of a user by their ID.
   *
   * @param userId
   */
  async findUserById(userId: string): Promise<User> {
    let user = (await this.cacheManager.get(userId)) as User | undefined;

    if (!user) {
      user = await this.db.dbConfig.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
      });

      if (!user) {
        this.logger.error(
          `User with ID ${userId} not found`,
          new NotFoundException('User not found').stack,
          'UserUtilService',
        );
        throw new NotFoundException('User not found');
      }

      await this.cacheManager.set(
        userId,
        JSON.stringify(user),
        envConfig.ACCESS_TOKEN_EXPIRES_IN * 60 * 60 * 1000,
      );
    }

    return user;
  }
}
