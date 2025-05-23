import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { UserJwtPayload } from '../../../infrastructure/jwt/service/jwt.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  RefreshTokenResponse,
  SetPasswordDto,
  SignInDto,
  SignInResponse,
  SignUpDto,
} from '../dto/auth.dto';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { User, usersTable } from '../../../config/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { WinstonLogger } from '../../../infrastructure/logger/logger.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { envConfig } from '../../../config/env.config';
import { MailService } from '../../../infrastructure/mail/mail.service';
import { JwtService } from '../../../infrastructure/jwt/service/jwt.service';
import { UserUtilService } from '../../../common/util/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: MailService,
    private readonly db: DatabaseService,
    private readonly logger: WinstonLogger,
    private readonly util: UserUtilService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a new user in the database.
   *
   * @param signUpDto
   */
  async signUp(signUpDto: SignUpDto): Promise<Partial<User>> {
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

    if (!user.emailVerified) {
      this.logger.error(
        `User ${signInDto.email} email not verified`,
        new UnauthorizedException('Email not verified').stack,
        'UserService',
      );
      throw new UnauthorizedException('Email not verified');
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
      this.jwtService.generateAccessToken(userPayload),
      this.jwtService.generateRefreshToken(userPayload),
      this.cacheManager.set(
        userPayload.sub,
        JSON.stringify(user),
        envConfig.ACCESS_TOKEN_EXPIRES_IN * 60 * 60 * 1000,
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

    const accessToken = await this.jwtService.generateAccessToken(userPayload);

    this.logger.log(`User ${userFromJwt.email} refreshed token`, 'UserService');

    return { accessToken };
  }

  /**
   * Logs out a user by blacklisting the token and removing it from the cache.
   *
   * @param user
   */
  async signOut(user: UserJwtPayload): Promise<void> {
    if (user.jti) {
      this.logger.log(`User ${user.sub} logged out`, 'UserService');
      await this.util.findUserById(user.sub);

      await Promise.all([
        this.jwtService.blacklistTokenFromPayload(user),
        this.cacheManager.del(user.sub),
      ]);
    } else {
      this.logger.error(
        `User ${user.sub} failed to signOut`,
        new UnauthorizedException('Invalid token').stack,
        'UserService',
      );
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Sends an OTP email to the user.
   *
   * @param email
   * @param retry
   */
  async sendOtpEmail(email: string, retry?: boolean): Promise<void> {
    let otp = (await this.cacheManager.get(email)) as string;

    if (otp && !retry) {
      this.logger.error(
        `OTP already sent to ${email}`,
        new ConflictException('OTP already sent').stack,
        'UserService',
      );
      throw new ConflictException('OTP already sent');
    }

    const attempt = (await this.cacheManager.get(`${email}_attempt`)) as number;

    if (attempt && attempt > 3) {
      this.logger.error(
        'Too many attempts send otp',
        new ConflictException('Too many attempts').stack,
        'UserService',
      );
      throw new ConflictException('Too many attempts');
    }

    otp = await this.emailService.sendOtpEmail(email);
    this.logger.log(`OTP sent to ${email}`, 'UserService');

    await Promise.all([
      this.cacheManager.set(email, otp, 5 * 60 * 1000),
      this.cacheManager.set(
        `${email}_attempt`,
        attempt ? attempt + 1 : 1,
        5 * 60 * 1000,
      ),
    ]);
  }

  /**
   * Verifies the OTP sent to the user's email.
   *
   * @param email
   * @param otp
   */
  async verifyEmail(email: string, otp: string): Promise<void> {
    const cachedOtp = (await this.cacheManager.get(email)) as string;

    if (!cachedOtp) {
      this.logger.error(
        `OTP not found for ${email}`,
        new NotFoundException('OTP not found').stack,
        'UserService',
      );
      throw new NotFoundException('OTP not found');
    }

    if (cachedOtp !== otp) {
      this.logger.error(
        `Invalid OTP for ${email}`,
        new UnauthorizedException('Invalid OTP').stack,
        'UserService',
      );
      throw new UnauthorizedException('Invalid OTP');
    }

    await Promise.all([
      this.cacheManager.del(email),
      this.db.dbConfig
        .update(usersTable)
        .set({
          emailVerified: new Date(),
          updatedAt: new Date().toDateString(),
        })
        .where(eq(usersTable.email, email)),
      this.cacheManager.del(`${email}_attempt`),
    ]);

    this.logger.log(`OTP verified for ${email}`, 'UserService');
  }

  /**
   * Handles the Google OAuth callback and generates access and refresh tokens.
   *
   * @param user
   */
  async googleCallback(user: User): Promise<SignInResponse> {
    const userPayload: UserJwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.generateAccessToken(userPayload),
      this.jwtService.generateRefreshToken(userPayload),
    ]);

    this.logger.log(`User ${user.email} logged in with google`, 'UserService');

    return { accessToken, refreshToken };
  }

  /**
   * Sets a password for a user who logged in with Google.
   *
   * @param data
   */
  async setPassword(data: SetPasswordDto): Promise<void> {
    const user = await this.db.dbConfig.query.usersTable.findFirst({
      where: eq(usersTable.email, data.email),
    });

    if (!user) {
      this.logger.error(
        `User with email ${data.email} not found`,
        new NotFoundException('User not found').stack,
        'UserService',
      );
      throw new NotFoundException('User not found');
    }

    if (user.password) {
      this.logger.error(
        `User with email ${data.email} already has a password`,
        new ConflictException('User already has a password').stack,
        'UserService',
      );
      throw new ConflictException('User already has a password');
    }

    const hashedPassword = await bcrypt.hash(data.new_password, 10);

    await this.db.dbConfig
      .update(usersTable)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toDateString(),
      })
      .where(eq(usersTable.id, user.id));

    this.logger.log(`Password updated for ${data.email}`, 'UserService');
  }

  /**
   * Changes the password for a user.
   *
   * @param data
   * @param userId
   */
  async changePassword(data: ChangePasswordDto, userId: string): Promise<void> {
    const user = await this.util.findUserById(userId);

    if (!user.password) {
      this.logger.error(
        `User with ID ${userId} does not have a password`,
        new ConflictException('User does not have a password').stack,
        'UserService',
      );
      throw new ConflictException('User does not have a password');
    }

    if (!(await bcrypt.compare(data.old_password, user.password))) {
      this.logger.error(
        `Invalid old password for user ${userId}`,
        new UnauthorizedException('Invalid old password').stack,
        'UserService',
      );
      throw new UnauthorizedException('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(data.new_password, 10);

    await Promise.all([
      this.db.dbConfig
        .update(usersTable)
        .set({
          password: hashedPassword,
          updatedAt: new Date().toDateString(),
        })
        .where(eq(usersTable.id, userId)),
      this.cacheManager.del(userId),
      this.cacheManager.set(
        userId,
        JSON.stringify({ ...user, password: hashedPassword }),
        envConfig.ACCESS_TOKEN_EXPIRES_IN * 60 * 60 * 1000,
      ),
    ]);
    this.logger.log(`Password updated for user ${userId}`, 'UserService');
  }

  /**
   * Handles the forgot password process.
   *
   * @param data
   */
  async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const user = await this.db.dbConfig.query.usersTable.findFirst({
      where: eq(usersTable.email, data.email),
    });

    if (!user) {
      this.logger.error(
        `User with email ${data.email} not found`,
        new NotFoundException('User not found').stack,
        'UserService',
      );
      throw new NotFoundException('User not found');
    }

    const cachedOtp = (await this.cacheManager.get(data.email)) as string;
    console.log(cachedOtp);

    if (!cachedOtp) {
      this.logger.error(
        `OTP not found for ${data.email}`,
        new NotFoundException('OTP not found').stack,
        'UserService',
      );
      throw new NotFoundException('OTP not found');
    }

    if (cachedOtp !== data.otp) {
      this.logger.error(
        `Invalid OTP for ${data.email}`,
        new UnauthorizedException('Invalid OTP').stack,
        'UserService',
      );
      throw new UnauthorizedException('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(data.new_password, 10);

    await Promise.all([
      this.db.dbConfig
        .update(usersTable)
        .set({
          password: hashedPassword,
          updatedAt: new Date().toDateString(),
        })
        .where(eq(usersTable.email, data.email)),
      this.cacheManager.del(data.email),
      this.cacheManager.del(`${data.email}_attempt`),
    ]);
    this.logger.log(`Password updated for ${data.email}`, 'UserService');
  }
}
