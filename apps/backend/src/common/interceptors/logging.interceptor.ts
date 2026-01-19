import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'winston';

/**
 * HTTP request logger interceptor
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; url: string; user?: { id?: string } }>();
    const { method, url } = request;
    const userId = request.user?.id || 'anonymous';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.info(`${method} ${url} - ${duration}ms`, {
            method,
            url,
            userId,
            duration,
            status: 'success',
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - start;
          this.logger.error(
            `${method} ${url} - ${duration}ms - ${error.message}`,
            {
              method,
              url,
              userId,
              duration,
              status: 'error',
              error: error.message,
            },
          );
        },
      }),
    );
  }
}
