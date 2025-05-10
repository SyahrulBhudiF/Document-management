import { Module } from '@nestjs/common';
import { WinstonLogger } from './logger.service';

@Module({
  providers: [WinstonLogger],
  exports: [WinstonLogger],
})
export class LoggerModule {}
