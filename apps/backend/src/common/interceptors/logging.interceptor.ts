import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLogger } from '../logger';

/**
 * HTTP request logger interceptor
 * AppLogger kullanarak request/response loglar
 * Context (requestId, userId) otomatik eklenir
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly appLogger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; url: string }>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          // Context otomatik (requestId, userId)
          this.appLogger.http('Request completed', {
            method,
            url,
            duration,
            status: 'success',
          });
        },
        // Error logging removed - HttpExceptionFilter handles all errors
      }),
    );
  }
}
