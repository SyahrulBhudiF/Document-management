import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
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
        password_confirmation: { type: 'string', minLength: 8, maxLength: 32 },
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
