import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from './service/auth.service';
import {
  SignUpDto,
  SignUpSchema,
  SignInDto,
  SignInSchema,
  SendEmailSchema,
  SendEmailDto,
  VerifyOtpSchema,
  VerifyOtpDto,
  SetPasswordSchema,
  SetPasswordDto,
} from './dto/auth.dto';
import { ZodValidationPipe } from '../../common/pipe/zod.pipe';
import { AccessTokenGuard } from '../../infrastructure/jwt/guard/access-token.guard';
import { RefreshTokenGuard } from '../../infrastructure/jwt/guard/refresh-token.guard';
import { UserJwtPayload } from '../../infrastructure/jwt/service/jwt.service';
import { GetCurrentUser } from '../../common/decorator/custom.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GoogleAuthGuard } from '../../infrastructure/google/guard/google.guard';
import { User } from '../../config/db/schema';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly userService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User signed in successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 50 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 32 },
        password_confirmation: {
          type: 'string',
          minLength: 8,
          maxLength: 32,
          pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()]).{8,32}',
        },
      },
      example: {
        name: 'John Doe',
        email: 'john@gmail.com',
        password: 'Password123!',
        password_confirmation: 'Password123!',
      },
      required: ['name', 'email', 'password', 'password_confirmation'],
    },
  })
  async signUp(
    @Body(new ZodValidationPipe(SignUpSchema)) signUpDto: SignUpDto,
  ) {
    const result = await this.userService.signUp(signUpDto);
    return {
      message: 'User created successfully',
      data: result,
    };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in an existing user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User signed in successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Email not verified',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 32 },
      },
      example: {
        email: 'john@gmail.com',
        password: 'Password123!',
      },
      required: ['email', 'password'],
    },
  })
  async signIn(
    @Body(new ZodValidationPipe(SignInSchema)) signInDto: SignInDto,
  ) {
    const result = await this.userService.signIn(signInDto);
    return {
      message: 'User signed in successfully',
      data: result,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out the current user' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged out successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User not found for logout',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string' },
      },
      example: {
        refresh_token: 'refresh_token',
      },
      required: ['refresh_token'],
    },
  })
  async logout(@GetCurrentUser() user: UserJwtPayload) {
    const result = await this.userService.logout(user);
    return {
      message: 'User logged out successfully',
      data: result,
    };
  }

  @UseGuards(RefreshTokenGuard)
  @UseGuards(AccessTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh the access token' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User not found for refresh token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string' },
      },
      example: {
        refresh_token: 'refresh_token',
      },
      required: ['refresh_token'],
    },
  })
  async refreshToken(@GetCurrentUser() user: UserJwtPayload) {
    const result = await this.userService.refreshToken(user);
    return {
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'OTP already sent',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        retry: { type: 'boolean' },
      },
      example: {
        email: 'john@gmail.com',
        retry: false,
      },
      required: ['email'],
    },
  })
  async sendOtpEmail(
    @Body(new ZodValidationPipe(SendEmailSchema)) data: SendEmailDto,
  ) {
    const result = await this.userService.sendOtpEmail(data.email, data.retry);
    return {
      message: 'OTP sent successfully',
      data: result,
    };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'OTP not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid OTP',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        otp: { type: 'string' },
      },
      example: {
        email: 'john@gmail.com',
        otp: '123456',
      },
      required: ['email', 'otp'],
    },
  })
  async verifyOtp(
    @Body(new ZodValidationPipe(VerifyOtpSchema)) data: VerifyOtpDto,
  ) {
    await this.userService.verifyOtp(data.email, data.otp);
    return {
      message: 'OTP verified successfully',
    };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google authentication (Open it at browser not at documentation)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Redirecting to Google authentication',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Email not verified',
  })
  async google() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google authentication callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User signed in successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async googleCallback(@Req() req: { user: User }) {
    const { accessToken, refreshToken } = await this.userService.googleCallback(
      req.user,
    );
    return {
      message: 'User signed in successfully',
      data: {
        accessToken,
        refreshToken,
      },
    };
  }

  @UseGuards(AccessTokenGuard)
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set password for the user are login with google' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password set successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Password already set',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        new_password: {
          type: 'string',
          minLength: 8,
          maxLength: 32,
          pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()]).{8,32}',
        },
      },
      example: {
        email: 'jhon@gmail.com',
        new_password: 'Password123!',
      },
      required: ['email', 'new_password'],
    },
  })
  async setPassword(
    @Body(new ZodValidationPipe(SetPasswordSchema)) data: SetPasswordDto,
  ) {
    await this.userService.setPassword(data);
    return {
      message: 'Password set successfully',
    };
  }

  @UseGuards(AccessTokenGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getProfile(@GetCurrentUser('sub') userId: string) {
    const result = await this.userService.getUserProfile(userId);
    return {
      message: 'User profile retrieved successfully',
      data: result,
    };
  }
}
