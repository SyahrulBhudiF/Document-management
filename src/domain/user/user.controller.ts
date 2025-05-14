import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './service/user.service';
import { AccessTokenGuard } from '../../infrastructure/jwt/guard/access-token.guard';
import { GetCurrentUser } from '../../common/decorator/custom.decorator';
import { UpdateUserDto } from './dto/user.dto';
import { ProfileUploadInterceptor } from '../../common/interceptor/implementation/profile-upload.interceptor';
import { UserJwtPayload } from '../../infrastructure/jwt/service/jwt.service'; // Import the specific interceptor

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AccessTokenGuard)
  @Get('/')
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
  async getUser(@GetCurrentUser('sub') userId: string) {
    const result = await this.userService.getUser(userId);
    return {
      message: 'User profile retrieved successfully',
      data: result,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Patch('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @UseInterceptors(ProfileUploadInterceptor)
  async patchUser(
    @GetCurrentUser('sub') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() profilePicture?: Express.Multer.File,
  ) {
    const result = await this.userService.updateUser(
      updateUserDto,
      userId,
      profilePicture,
    );
    return {
      message: 'User profile updated successfully',
      data: result,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Get('/profile-picture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the current user profile picture' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile picture retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getProfilePicture(@GetCurrentUser('sub') userId: string) {
    return await this.userService.getProfilePicture(userId);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete the current user profile' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async deleteUser(@GetCurrentUser() user: UserJwtPayload) {
    await this.userService.deleteUser(user);
    return {
      message: 'User profile deleted successfully',
    };
  }
}
