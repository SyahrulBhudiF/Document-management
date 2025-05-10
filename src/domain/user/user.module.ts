import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './service/user.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../../infrastructure/auth/auth.module';
import { LoggerModule } from '../../infrastructure/logger/logger.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [DatabaseModule, LoggerModule, AuthModule],
})
export class UserModule {}
