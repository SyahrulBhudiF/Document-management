import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WinstonLogger } from '../infrastructure/logger/logger.service';
import { SwaggerModule } from '@nestjs/swagger';
import { config } from '../config/swagger.config';
import { envConfig } from '../config/env.config';
import { Exception } from '../common/filter/exception.filter';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(WinstonLogger);
  app.useLogger(logger);

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new Exception(httpAdapterHost, logger));

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(envConfig.PORT);
}
