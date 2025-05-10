import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  AuthService,
  UserJwtPayload,
} from '../../../infrastructure/auth/service/auth.service';
import {
  SignInDto,
  SignUpDto,
  toUserResponse,
  UserResponse,
} from '../dto/user.dto';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { usersTable } from '../../../config/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../../config/db/schema';
import { WinstonLogger } from '../../../infrastructure/logger/logger.service';

@Injectable()
export class UserService {
  constructor(
    private readonly authService: AuthService,
    private readonly db: DatabaseService,
    private readonly logger: WinstonLogger,
  ) {}

  async signUp(
    signUpDto: SignUpDto,
  ): Promise<Pick<User, 'id' | 'email' | 'name'>> {
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

  async signIn(
    signInDto: SignInDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
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

    const userPayload: UserJwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      jti: uuidv4(),
    };

    const accessToken = await this.authService.generateAccessToken(userPayload);
    const refreshToken =
      await this.authService.generateRefreshToken(userPayload);

    this.logger.log(`User ${signInDto.email} logged in`, 'UserService');

    return { accessToken, refreshToken };
  }

  async refreshToken(
    userFromJwt: UserJwtPayload,
  ): Promise<{ accessToken: string }> {
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
      jti: uuidv4(),
    };

    const accessToken = await this.authService.generateAccessToken(userPayload);

    this.logger.log(`User ${userFromJwt.email} refreshed token`, 'UserService');

    return { accessToken };
  }

  async logout(user: UserJwtPayload): Promise<void> {
    if (user.jti) {
      this.logger.log(`User ${user.sub} logged out`, 'UserService');
      await this.authService.blacklistTokenFromPayload(user);
    } else {
      this.logger.error(
        `User ${user.sub} failed to log out`,
        new UnauthorizedException('Invalid token').stack,
        'UserService',
      );
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUserProfile(userId: string): Promise<UserResponse> {
    const user = await this.db.dbConfig.query.usersTable.findFirst({
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

    if (!user) {
      this.logger.error(
        `User with ID ${userId} not found`,
        new NotFoundException('User not found').stack,
        'UserService',
      );
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User ${userId} profile retrieved`, 'UserService');
    return toUserResponse(user);
  }
}
