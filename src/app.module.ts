import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { DomainModule } from './domain/domain.module';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
  imports: [
    CacheModule.register({ isGlobal: true }),
    LoggerModule,
    InfrastructureModule,
    DomainModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
