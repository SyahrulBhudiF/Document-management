import { Module } from '@nestjs/common';
import { UtilModule } from './util/util.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { LoggerModule } from '../infrastructure/logger/logger.module';

@Module({
  imports: [UtilModule, DatabaseModule, LoggerModule],
  exports: [UtilModule],
})
export class CommonModule {}
