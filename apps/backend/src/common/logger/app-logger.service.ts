import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LogCategory, LogMetadata } from './interfaces/log-context.interface';
import { LogContextService } from './log-context.service';

// winston log seviyeleri
type WinstonLogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

// merkezi log servisi
// requestId, userId gibi bilgileri otomatik ekliyor
@Injectable()
export class AppLogger {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly winston: Logger,
    private readonly contextService: LogContextService,
  ) {}

  // asıl log'u oluşturan fonksiyon
  private log(
    level: WinstonLogLevel,
    category: LogCategory,
    message: string,
    metadata?: LogMetadata,
  ): void {
    const context = this.contextService.getContext();

    this.winston.log(level, message, {
      category,
      context: context
        ? {
            requestId: context.requestId,
            userId: context.userId,
            ipAddress: context.ipAddress,
            endpoint: context.endpoint,
            method: context.method,
          }
        : undefined,
      metadata,
    });
  }

  // HTTP istekleri için
  http(message: string, metadata?: LogMetadata): void {
    this.log('info', LogCategory.HTTP, message, metadata);
  }

  // güvenlik olayları için
  security(message: string, metadata?: LogMetadata): void {
    this.log('warn', LogCategory.SECURITY, message, metadata);
  }

  // iş mantığı logları
  business(message: string, metadata?: LogMetadata): void {
    this.log('info', LogCategory.BUSINESS, message, metadata);
  }

  // veritabanı işlemleri için
  database(message: string, metadata?: LogMetadata): void {
    this.log('debug', LogCategory.DATABASE, message, metadata);
  }

  // altyapı logları - redis, db bağlantıları vs
  infrastructure(message: string, metadata?: LogMetadata): void {
    this.log('info', LogCategory.INFRASTRUCTURE, message, metadata);
  }

  // hata logları
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.log('error', LogCategory.ERROR, message, {
      ...metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            // production'da 10 satır, development'ta full stack göster
            stack:
              process.env.NODE_ENV === 'production'
                ? error.stack?.split('\\n').slice(0, 10).join('\\n')
                : error.stack,
          }
        : undefined,
    });
  }
}
