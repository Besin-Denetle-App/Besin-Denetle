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
 * Authenticated kullanıcıların last_active tarihini güncelleyen interceptor.
 * Her başarılı istekte kullanıcının son çevrimiçi tarihini günceller.
 *
 * Not: Performans için async güncelleme yapılır, istek beklemez.
 */
@Injectable()
export class LastActiveInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { id?: string } | undefined;

    // Authenticated kullanıcı varsa last_active güncelle
    if (user?.id) {
      // Async güncelleme - isteği bekletmez
      this.updateLastActive(user.id).catch(() => {
        // Hata durumunda sessizce devam et - kritik değil
      });
    }

    return next.handle();
  }

  /**
   * Kullanıcının last_active tarihini günceller.
   */
  private async updateLastActive(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      last_active: new Date(),
    });
  }
}
