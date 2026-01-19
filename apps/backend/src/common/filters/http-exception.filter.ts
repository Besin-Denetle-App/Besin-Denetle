import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter
 * Tüm hataları standart formatta döndürür.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // HTTP status ve mesajı belirle
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
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
    const logContext = `${request.method} ${request.url}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // 5xx: Sunucu hataları - ERROR + stack
      this.logger.error(
        `[${status}] ${message} - ${logContext}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
      // 429: Rate limit - WARN
      this.logger.warn(`[${status}] ${message} - ${logContext}`);
    }
    // 4xx: Normal akış, log yok

    response.status(status).json(errorResponse);
  }
}
