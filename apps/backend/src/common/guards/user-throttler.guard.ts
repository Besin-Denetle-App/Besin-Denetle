import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * User bazlı Rate Limiting Guard.
 * Authenticated kullanıcılar için user ID'ye göre,
 * anonymous kullanıcılar için IP'ye göre throttle uygular.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  /**
   * İstek sahibini tanımlar (throttle key).
   * JWT ile giriş yapmış kullanıcı varsa user ID,
   * yoksa IP adresi kullanılır.
   */
  protected async getTracker(req: Request): Promise<string> {
    // Express request'ten user bilgisini al (JwtAuthGuard tarafından eklenir)
    const user = req['user'] as { id?: string } | undefined;

    if (user?.id) {
      // Authenticated kullanıcı - user ID ile throttle
      return `user:${user.id}`;
    }

    // Anonymous kullanıcı - IP ile throttle
    return `ip:${req.ip || 'unknown'}`;
  }
}
