import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { User } from '../../entities';

/**
 * Last active güncelleyici interceptor
 * Her istekte kullanıcının son aktif tarihini günceller.
 */
@Injectable()
export class LastActiveInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id?: string } }>();
    const user = request.user;

    // User varsa last_active güncelle
    if (user?.id) {
      // Async - isteği bekletmez
      this.updateLastActive(user.id).catch(() => {
        // Hata olursa sessizce devam
      });
    }

    return next.handle();
  }

  /**
   * last_active güncelle
   */
  private async updateLastActive(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      last_active: new Date(),
    });
  }
}
