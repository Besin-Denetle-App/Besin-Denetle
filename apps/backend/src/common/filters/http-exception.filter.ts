import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Tüm HTTP hatalarını standart bir formatta döndüren global exception filter.
 * Bu sayede frontend her zaman aynı yapıda hata yanıtı alır.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Hata mesajını çıkar
    let message = exception.message;
    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as Record<string, unknown>).message;
      message = Array.isArray(msg) ? msg.join(', ') : String(msg);
    }

    // Standart hata formatı
    const errorResponse = {
      success: false,
      error: {
        code: status,
        message,
        timestamp: new Date().toISOString(),
      },
    };

    // Sadece 500+ hataları logla (sunucu hataları)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`[${status}] ${message}`, exception.stack);
    }

    response.status(status).json(errorResponse);
  }
}
