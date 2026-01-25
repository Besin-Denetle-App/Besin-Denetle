import { Controller, Get, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { DataSource } from 'typeorm';

import {
  getClientIp,
  RateLimitHealthConfig,
  RateLimitKeyPrefix,
  RateLimitService,
} from '../../common';

/**
 * Health check endpoint
 */
@ApiTags('health')
@Controller('api/health')
export class HealthcheckController {
  private readonly startTime = Date.now();

  constructor(
    private readonly dataSource: DataSource,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Sunucu sağlık kontrolü' })
  @ApiResponse({ status: 200, description: 'Sunucu sağlıklı' })
  async check(@Req() req: Request) {
    // IP bazlı rate limit kontrolü
    const healthConfig =
      this.configService.get<RateLimitHealthConfig>('rateLimit.health')!;
    const clientIp = getClientIp(req);

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
