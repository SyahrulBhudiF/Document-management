import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { UserUtilService } from './user.service';

@Module({
  providers: [UserUtilService],
  exports: [UserUtilService],
  imports: [DatabaseModule, LoggerModule],
})
export class UserModule {}
