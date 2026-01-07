import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Sunucu sağlık kontrolü için basit endpoint.
 * Load balancer, Docker healthcheck ve monitoring araçları tarafından kullanılır.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  @ApiOperation({ summary: 'Sunucu sağlık kontrolü' })
  @ApiResponse({ status: 200, description: 'Sunucu sağlıklı' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000), // saniye
    };
  }
}
