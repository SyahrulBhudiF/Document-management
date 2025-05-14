import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { LoggerModule } from '../../infrastructure/logger/logger.module';

@Module({
  imports: [UserModule, DatabaseModule, LoggerModule],
  exports: [UserModule],
})
export class UtilModule {}
