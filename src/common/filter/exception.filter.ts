import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';
import { WinstonLogger } from '../../infrastructure/logger/logger.service';

interface HttpExceptionResponse {
  message: string;
  errors?: Record<string, any>;
}

interface ResponseBody {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  details?: Record<string, any>;
}

@Injectable()
@Catch()
export class Exception implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: WinstonLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const httpStatus: number =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody: ResponseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getErrorMessage(exception),
    };

    const errorDetails = this.getErrorDetails(exception);
    if (errorDetails) {
      responseBody.details = errorDetails;
    }

    const logMessage = 'Exception occurred';
    let traceMessage: string | undefined;

    if (exception instanceof Error && typeof exception.stack === 'string') {
      traceMessage = exception.stack;
    } else {
      traceMessage = String(exception);
    }

    const contextDetails = {
      statusCode: responseBody.statusCode,
      path: responseBody.path,
      method: responseBody.method,
      errorMessage: responseBody.message,
    };
    const contextMessage: string = JSON.stringify(contextDetails);

    this.logger.error(logMessage, traceMessage, contextMessage);

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }

      const errorResponse = response as HttpExceptionResponse;
      return errorResponse.message || 'Unknown error occurred';
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return String(exception);
  }

  private getErrorDetails(exception: unknown): Record<string, any> | null {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (
        typeof response === 'object' &&
        response !== null &&
        'errors' in response
      ) {
        return (response as HttpExceptionResponse).errors ?? null;
      }
    }
    return null;
  }
}
