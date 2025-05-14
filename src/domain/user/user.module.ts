import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './user.controller';
import { LoggerModule } from '../../infrastructure/logger/logger.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UserModule as Util } from '../../common/util/user/user.module';

@Module({
  providers: [UserService],
  controllers: [UserController],
  imports: [LoggerModule, DatabaseModule, Util],
})
export class UserModule {}
