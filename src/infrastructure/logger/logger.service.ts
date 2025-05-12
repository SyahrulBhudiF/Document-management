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
        winston.format.printf((info) => {
          const { level, message, timestamp, stack, context } = info;
          const timestampStr = new Date(timestamp as string).toISOString();
          const messageStr =
            typeof message === 'string' ? message : JSON.stringify(message);

          let stackStr = '';
          if (stack) {
            stackStr =
              typeof stack === 'string' ? stack : JSON.stringify(stack);
          }

          const contextStr =
            typeof context === 'string'
              ? `[${context}] `
              : context
                ? `[${JSON.stringify(context)}] `
                : '';
          const outputMessage = stack ? stackStr : messageStr || 'No message';

          return `[${timestampStr}] ${contextStr}${level}: ${outputMessage}`;
        }),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf((info) => {
              const { level, message, timestamp, context } = info;
              const timestampStr = new Date(timestamp as string).toISOString();
              const messageStr =
                typeof message === 'string' ? message : JSON.stringify(message);
              const contextStr =
                typeof context === 'string'
                  ? `[${context}] `
                  : context
                    ? `[${JSON.stringify(context)}] `
                    : '';
              return `[${timestampStr}] ${contextStr}${level}: ${messageStr || 'No message'}`;
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
    const error = new Error(message);
    if (trace) error.stack = trace;
    this.logger.error(message, { error, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
