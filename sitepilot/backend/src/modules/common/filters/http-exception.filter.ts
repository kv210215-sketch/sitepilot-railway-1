import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Внутрішня помилка сервера';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as
        | string
        | { message?: string | string[]; error?: string };

      if (typeof res === 'string') {
        message = res;
      } else {
        message = res.message ?? exception.message;
        error = res.error;
      }
    } else if (exception instanceof QueryFailedError) {
      // PostgreSQL unique violation
      const pg = exception as QueryFailedError & { code?: string };
      if (pg.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'Запис вже існує';
      } else if (pg.code === '23503') {
        status = HttpStatus.BAD_REQUEST;
        message = "Зв'язаний запис не знайдено";
      } else {
        this.logger.error('DB error', exception);
      }
    } else {
      this.logger.error('Unhandled exception', exception as Error);
    }

    const body: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }
}
