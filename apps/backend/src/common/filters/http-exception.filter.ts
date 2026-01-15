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
 * Tüm hataları standart bir formatta döndüren global exception filter.
 * Bu sayede frontend her zaman aynı yapıda hata yanıtı alır.
 *
 * Yakalanan hatalar:
 * - HttpException ve türevleri (BadRequest, NotFound, Unauthorized vb.)
 * - Beklenmeyen hatalar (TypeORM, validation vb.)
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // HTTP durumu ve mesajı belirle
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

        // Özel hata kodu varsa kullan (örn: 'PRODUCT_NOT_FOUND')
        if ('error' in exceptionResponse) {
          errorCode = (exceptionResponse as Record<string, unknown>)
            .error as string;
        }
      }
    } else if (exception instanceof Error) {
      // Beklenmeyen hatalar (TypeORM, vs.)
      message = 'Sunucu hatası oluştu';
      // Production'da gerçek hata mesajını gizle
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

    // Loglama stratejisi
    const logContext = `${request.method} ${request.url}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // 5xx: Sunucu hataları - ERROR seviyesi + stack trace
      this.logger.error(
        `[${status}] ${message} - ${logContext}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
      // 429: Rate limit - WARN seviyesi (izleme için önemli)
      this.logger.warn(`[${status}] ${message} - ${logContext}`);
    }
    // 4xx (400, 401, 403, 404): Normal akış, loglama yok

    response.status(status).json(errorResponse);
  }
}
