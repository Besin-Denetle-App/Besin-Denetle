import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * User bazlı Rate Limiting Guard
 * User ID veya IP'ye göre throttle uygular.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  /**
   * Throttle key belirle (user ID veya IP)
   */
  protected getTracker(req: Request): Promise<string> {
    // User bilgisini al (JwtAuthGuard ekler)
    const user = req['user'] as { id?: string } | undefined;

    if (user?.id) {
      // Authenticated - user ID ile throttle
      return Promise.resolve(`user:${user.id}`);
    }

    // Anonymous - IP ile throttle
    return Promise.resolve(`ip:${req.ip || 'unknown'}`);
  }
}
