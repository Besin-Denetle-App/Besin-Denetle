import { Controller, Get, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

import {
  RateLimitHealthConfig,
  RateLimitKeyPrefix,
  RateLimitService,
} from '../../common/rate-limit';

/**
 * Request interface
 */
interface HealthRequest {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}

/**
 * Health check endpoint
 */
@ApiTags('health')
@Controller('health')
export class HealthcheckController {
  private readonly startTime = Date.now();

  constructor(
    private readonly dataSource: DataSource,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Client IP adresini al (Cloudflare uyumlu)
   */
  private getClientIp(req: HealthRequest): string {
    // Cloudflare öncelik
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) {
      return Array.isArray(cfIp) ? cfIp[0] : cfIp;
    }

    // X-Forwarded-For fallback
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ip.split(',')[0].trim();
    }

    // Son çare: socket IP
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  @Get()
  @ApiOperation({ summary: 'Sunucu sağlık kontrolü' })
  @ApiResponse({ status: 200, description: 'Sunucu sağlıklı' })
  async check(@Request() req: HealthRequest) {
    // IP bazlı rate limit kontrolü
    const healthConfig =
      this.configService.get<RateLimitHealthConfig>('rateLimit.health')!;
    const clientIp = this.getClientIp(req);

    await this.rateLimitService.checkIpLimit(
      RateLimitKeyPrefix.HEALTH,
      clientIp,
      healthConfig.check_ip,
      'health_check',
    );

    await this.rateLimitService.incrementIpLimit(
      RateLimitKeyPrefix.HEALTH,
      clientIp,
      healthConfig.check_ip,
    );

    // DB kontrolü
    let dbStatus = 'ok';
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000), // saniye
      database: dbStatus,
    };
  }
}
