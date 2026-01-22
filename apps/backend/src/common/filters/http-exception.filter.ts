import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger';

/**
 * Global exception filter
 * Tüm hataları standart formatta döndürür.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly appLogger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // HTTP status ve mesajı belirle
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Beklenmeyen bir hata oluştu';
    let errorCode: string | number = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode = status;

      const exceptionResponse = exception.getResponse();

      // Hata mesajını çıkar
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const msg = (exceptionResponse as Record<string, unknown>).message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);

        // Özel hata kodu varsa kullan
        if ('error' in exceptionResponse) {
          errorCode = (exceptionResponse as Record<string, unknown>)
            .error as string;
        }
      }
    } else if (exception instanceof Error) {
      // Beklenmeyen hatalar
      message = 'Sunucu hatası oluştu';
      // Production'da gerçek hatayı gizle
      if (process.env.NODE_ENV === 'development') {
        message = exception.message;
      }
    }

    // Standart hata formatı
    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    // Log stratejisi

    if (status >= 500) {
      // 5xx: Sunucu hataları - ERROR log
      this.appLogger.error(
        `[${status}] ${message}`,
        exception instanceof Error ? exception : new Error(String(exception)),
        {
          path: request.url,
          method: request.method,
          statusCode: status,
        },
      );
    } else if (status === 401 || status === 403) {
      // 401/403: Güvenlik - Security log
      this.appLogger.security('Authentication/Authorization failure', {
        path: request.url,
        method: request.method,
        statusCode: status,
        message,
      });
    } else if (status === 429) {
      // 429: Rate limit - Security log
      this.appLogger.security('Rate limit triggered', {
        path: request.url,
        method: request.method,
        statusCode: status,
      });
    } else if (status >= 400 && status < 500) {
      // 4xx: Client hataları - analytics için minimal loglama
      this.appLogger.http('Client error', {
        path: request.url,
        method: request.method,
        statusCode: status,
      });
    }
    // Diğer 4xx: Normal akış

    response.status(status).json(errorResponse);
  }
}
