import {
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { existsSync, promises as fs } from 'fs';
import * as path from 'path';
import { User, usersTable } from '../../../config/db/schema';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { WinstonLogger } from '../../../infrastructure/logger/logger.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserResponse, toUserResponse, UpdateUserDto } from '../dto/user.dto';
import { envConfig } from '../../../config/env.config';
import { createReadStream } from 'fs';
import { UserUtilService } from '../../../common/util/user/user.service';
import {
  JwtService,
  UserJwtPayload,
} from '../../../infrastructure/jwt/service/jwt.service';

@Injectable()
export class UserService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
    private readonly logger: WinstonLogger,
    private readonly util: UserUtilService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Retrieves the profile of a user by their ID.
   *
   * @param userId
   */
  async getUser(userId: string): Promise<UserResponse> {
    let user: string | Partial<User> | undefined = (await this.cacheManager.get(
      userId,
    )) as string;

    if (!user) {
      user = await this.db.dbConfig.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
        columns: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          loginAt: true,
          emailVerified: true,
        },
      });
    } else {
      user = JSON.parse(user) as Partial<User>;
    }

    if (!user) {
      this.logger.error(
        `User with ID ${userId} not found`,
        new NotFoundException('User not found').stack,
        'UserService',
      );
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User ${user.email} profile retrieved`, 'UserService');
    return toUserResponse(user);
  }

  /**
   * Updates the profile of a user.
   *
   * @param data
   * @param userId
   * @param profilePicture
   */
  async updateUser(
    data: UpdateUserDto,
    userId: string,
    profilePicture?: Express.Multer.File,
  ): Promise<UserResponse> {
    const user = await this.util.findUserById(userId);

    let filePath = '';
    if (profilePicture) {
      filePath = `uploads/profile/${profilePicture.filename}`;
      if (user.profilePicture) {
        const absolutePath = path.resolve(user.profilePicture);
        if (existsSync(absolutePath)) {
          await fs.unlink(absolutePath);
          this.logger.log('Old Profile deleted successfully', 'UserService');
        }
      }
    }

    const updatedUser = {
      name: data.name || user.name,
      profilePicture: filePath || user.profilePicture,
      updatedAt: new Date().toDateString(),
    };

    const updated = await this.db.dbConfig
      .update(usersTable)
      .set(updatedUser)
      .where(eq(usersTable.id, userId))
      .returning();

    this.logger.log(`User ${updated[0].email} profile updated`, 'UserService');
    if (updated && updated[0]) {
      await this.cacheManager.set(
        userId,
        JSON.stringify(updated[0]),
        envConfig.ACCESS_TOKEN_EXPIRES_IN * 60 * 60 * 1000,
      );
    }

    return toUserResponse(updated[0]);
  }

  /**
   * Retrieves the profile picture of a user by their ID.
   *
   * @param userId
   */
  async getProfilePicture(userId: string): Promise<StreamableFile> {
    const user = await this.util.findUserById(userId);

    if (!user.profilePicture) {
      this.logger.error(
        `Profile picture not found for user ID ${userId}`,
        new NotFoundException('Profile picture not found').stack,
        'UserService',
      );
      throw new NotFoundException('Profile picture not found');
    }

    const file = createReadStream(user.profilePicture);
    return new StreamableFile(file);
  }

  /**
   * Deletes a user by their ID.
   *
   * @param data
   */
  async deleteUser(data: UserJwtPayload): Promise<void> {
    const user = await this.util.findUserById(data.sub);

    if (user.profilePicture) {
      const absolutePath = path.resolve(user.profilePicture);
      if (existsSync(absolutePath)) {
        await fs.unlink(absolutePath);
        this.logger.log('Profile deleted successfully', 'UserService');
      }
    }

    await Promise.all([
      this.db.dbConfig.delete(usersTable).where(eq(usersTable.id, user.id)),
      this.cacheManager.del(user.id),
      this.jwtService.blacklistTokenFromPayload(data),
    ]);
    this.logger.log(`User ${user.email} deleted`, 'UserService');
  }
}
