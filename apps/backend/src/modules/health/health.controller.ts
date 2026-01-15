import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { THROTTLE_HEALTH } from '../../config';

/**
 * Sunucu sağlık kontrolü için basit endpoint.
 * Load balancer, Docker healthcheck ve monitoring araçları tarafından kullanılır.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @Throttle(THROTTLE_HEALTH)
  @ApiOperation({ summary: 'Sunucu sağlık kontrolü' })
  @ApiResponse({ status: 200, description: 'Sunucu sağlıklı' })
  async check() {
    // Veritabanı bağlantı kontrolü
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
