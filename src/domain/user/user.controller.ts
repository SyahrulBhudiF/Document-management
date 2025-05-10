import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './service/user.service';
import {
  SignUpDto,
  SignUpSchema,
  SignInDto,
  SignInSchema,
} from './dto/user.dto';
import { ZodValidationPipe } from '../../common/pipe/zod.pipe';
import { AccessTokenGuard } from '../../infrastructure/auth/guard/access-token.guard';
import { RefreshTokenGuard } from '../../infrastructure/auth/guard/refresh-token.guard';
import { UserJwtPayload } from '../../infrastructure/auth/service/auth.service';
import { GetCurrentUser } from '../../common/decorator/custom.decorator';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
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
  async logout(@GetCurrentUser() user: UserJwtPayload) {
    const result = await this.userService.logout(user);
    return {
      message: 'User logged out successfully',
      data: result,
    };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@GetCurrentUser() user: UserJwtPayload) {
    const result = await this.userService.refreshToken(user);
    return {
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@GetCurrentUser('sub') userId: string) {
    const result = await this.userService.getUserProfile(userId);
    return {
      message: 'User profile retrieved successfully',
      data: result,
    };
  }
}
