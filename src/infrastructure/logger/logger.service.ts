import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class WinstonLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          const timestampStr =
            typeof timestamp === 'string' ? timestamp : String(timestamp);

          const messageStr =
            typeof message === 'string' ? message : JSON.stringify(message);
          const stackStr =
            typeof stack === 'string'
              ? stack
              : stack
                ? JSON.stringify(stack)
                : 'No stack';

          return `[${timestampStr}] ${level}: ${stackStr || messageStr || 'No message'}`;
        }),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp }) => {
              const timestampStr =
                typeof timestamp === 'string' ? timestamp : String(timestamp);
              const messageStr =
                typeof message === 'string' ? message : JSON.stringify(message);
              return `[${timestampStr}] ${level}: ${messageStr || 'No message'}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug?.(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose?.(message, { context });
  }
}
