import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RateLimitHelper } from './rate-limit.helper';
import { RateLimitService } from './rate-limit.service';

/**
 * Rate Limit Module
 *
 * Global modül olarak tanımlandı - tüm modüllerde kullanılabilir.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RateLimitService, RateLimitHelper],
  exports: [RateLimitService, RateLimitHelper],
})
export class RateLimitModule {}
