import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { LogContext } from './interfaces/log-context.interface';
import { LogContextService } from './log-context.service';

// her request için unique bir context oluşturuyor
// AsyncLocalStorage ile context'i saklıyoruz
@Injectable()
export class LogContextInterceptor implements NestInterceptor {
  constructor(private readonly contextService: LogContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { id?: string } }>();

    // context'i oluştur
    const logContext: LogContext = {
      requestId: uuidv4(),
      ipAddress: request.ip || request.socket?.remoteAddress || undefined,
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
      method: request.method,
      timestamp: new Date(),
      // userId authentication middleware'den gelecek
      userId: request.user?.id,
    };

    // AsyncLocalStorage ile context'i kaydet ve request'i çalıştır
    return new Observable((subscriber) => {
      // önemli: teardown function döndür
      return this.contextService.run(logContext, () => {
        const subscription = next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });

        // temizlik - subscription leak olmasın
        return () => subscription.unsubscribe();
      });
    });
  }
}
