import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { LoggerModule } from '../logger/logger.module';
import { BullModule } from '@nestjs/bullmq';
import { MailConsumer } from './mail.consumer';

@Module({
  providers: [MailService, MailConsumer],
  exports: [MailService, BullModule],
  imports: [
    LoggerModule,
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: 'localhost',
          port: 6379,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'mailQueue',
      connection: {
        host: 'localhost',
        port: 6379,
      },
      defaultJobOptions: {
        priority: 1,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }),
  ],
})
export class MailModule {}
