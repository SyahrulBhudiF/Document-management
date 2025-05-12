import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import {
  AuthService,
  UserJwtPayload,
} from '../../../infrastructure/auth/service/auth.service';
import {
  RefreshTokenResponse,
  SignInDto,
  SignInResponse,
  SignUpDto,
  toUserResponse,
  UserResponse,
} from '../dto/user.dto';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { User, usersTable } from '../../../config/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { WinstonLogger } from '../../../infrastructure/logger/logger.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { envConfig } from '../../../config/env.config';

@Injectable()
export class UserService {
  constructor(
    private readonly authService: AuthService,
    private readonly db: DatabaseService,
    private readonly logger: WinstonLogger,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a new user in the database.
   *
   * @param signUpDto
   */
  async signUp(signUpDto: SignUpDto): Promise<Partial<UserResponse>> {
    const existingUser = await this.db.dbConfig.query.usersTable.findFirst({
      where: eq(usersTable.email, signUpDto.email),
    });

    if (existingUser) {
      this.logger.error(
        `User with email ${signUpDto.email} already exists`,
        new ConflictException('Email already exists').stack,
        'UserService',
      );
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
    const userId = uuidv4();

    const newUserArr = await this.db.dbConfig
      .insert(usersTable)
      .values({
        id: userId,
        name: signUpDto.name,
        email: signUpDto.email,
        password: hashedPassword,
      })
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
      });

    if (!newUserArr || newUserArr.length === 0) {
      this.logger.error(
        `Failed to create user`,
        new Error('User creation failed').stack,
        'UserService',
      );
      throw new Error('User creation failed');
    }

    this.logger.log(`User ${signUpDto.email} created`, 'UserService');

    return newUserArr[0];
  }

  /**
   * Signs in a user and generates access and refresh tokens.
   *
   * @param signInDto
   */
  async signIn(signInDto: SignInDto): Promise<SignInResponse> {
    const user = await this.db.dbConfig.query.usersTable.findFirst({
      where: eq(usersTable.email, signInDto.email),
    });

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(signInDto.password, user.password))
    ) {
      this.logger.error(
        `Invalid credentials for user ${signInDto.email}`,
        new UnauthorizedException('Invalid credentials').stack,
        'UserService',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.db.dbConfig
      .update(usersTable)
      .set({
        loginAt: new Date(),
        updatedAt: new Date().toDateString(),
      })
      .where(eq(usersTable.id, user.id));

    const userPayload: UserJwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.authService.generateAccessToken(userPayload),
      this.authService.generateRefreshToken(userPayload),
      this.cacheManager.set(
        userPayload.sub,
        JSON.stringify(user),
        envConfig.ACCESS_TOKEN_EXPIRES_IN * 60 * 60,
      ),
    ]);

    this.logger.log(`User ${signInDto.email} logged in`, 'UserService');

    return { accessToken, refreshToken };
  }

  /**
   * Refreshes the access token for a user.
   *
   * @param userFromJwt
   */
  async refreshToken(
    userFromJwt: UserJwtPayload,
  ): Promise<RefreshTokenResponse> {
    const userExists = await this.db.dbConfig.query.usersTable.findFirst({
      where: eq(usersTable.id, userFromJwt.sub),
    });

    if (!userExists) {
      this.logger.error(
        `User with ID ${userFromJwt.sub} not found for refresh token`,
        new UnauthorizedException('User not found for refresh token').stack,
        'UserService',
      );
      throw new UnauthorizedException('User not found for refresh token');
    }

    const userPayload: UserJwtPayload = {
      sub: userFromJwt.sub,
      name: userFromJwt.name,
      email: userFromJwt.email,
    };

    const accessToken = await this.authService.generateAccessToken(userPayload);

    this.logger.log(`User ${userFromJwt.email} refreshed token`, 'UserService');

    return { accessToken };
  }

  /**
   * Logs out a user by blacklisting the token and removing it from the cache.
   *
   * @param user
   */
  async logout(user: UserJwtPayload): Promise<void> {
    if (user.jti) {
      this.logger.log(`User ${user.sub} logged out`, 'UserService');

      let userExists = (await this.cacheManager.get(user.sub)) as
        | User
        | undefined;

      if (!userExists) {
        userExists = await this.db.dbConfig.query.usersTable.findFirst({
          where: eq(usersTable.id, user.sub),
        });
      }

      if (!userExists) {
        this.logger.error(
          `User with ID ${user.sub} not found for logout`,
          new UnauthorizedException('User not found for logout').stack,
          'UserService',
        );
        throw new UnauthorizedException('User not found for logout');
      }

      await this.authService.blacklistTokenFromPayload(user);
      await this.cacheManager.del(user.sub);
    } else {
      this.logger.error(
        `User ${user.sub} failed to log out`,
        new UnauthorizedException('Invalid token').stack,
        'UserService',
      );
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Retrieves the profile of a user by their ID.
   *
   * @param userId
   */
  async getUserProfile(userId: string): Promise<UserResponse> {
    let user = (await this.cacheManager.get(userId)) as
      | Partial<User>
      | undefined;

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
}
