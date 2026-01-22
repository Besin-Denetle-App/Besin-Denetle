import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { LogContext } from './interfaces/log-context.interface';

// her request kendi context'ini barındırıyor
@Injectable()
export class LogContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<LogContext>();

  // context'i set et (request başlangıcında)
  run<T>(context: LogContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  // mevcut context'i al
  getContext(): LogContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  // context'e field ekle veya güncelle
  setField<K extends keyof LogContext>(key: K, value: LogContext[K]): void {
    const context = this.getContext();
    if (context) {
      context[key] = value;
    }
  }

  // kullanıcı giriş yaptıktan sonra userId'yi ekle
  setUserId(userId: string): void {
    this.setField('userId', userId);
  }
}
