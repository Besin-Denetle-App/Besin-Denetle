import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/env.validation';

async function bootstrap() {
  // Zorunlu ortam değişkenlerini kontrol et
  validateEnvironment();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Swagger konfigürasyonu
  const config = new DocumentBuilder()
    .setTitle('Besin Denetle API')
    .setDescription('Besin Denetle mobil uygulama backend API dokümantasyonu')
    .setVersion('1.0')
    // API tag'leri (akış sırasına göre)
    .addTag('auth', 'Kimlik doğrulama işlemleri')
    .addTag('products', 'Ürün tarama ve yönetimi')
    .addTag('content', 'Ürün içeriği (içindekiler, besin değerleri)')
    .addTag('analysis', 'AI sağlık analizi')
    .addTag('health', 'Sunucu sağlık kontrolü')
    // JWT Bearer token desteği - Swagger UI'da "Authorize" butonu ekler
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token giriniz',
      },
      'JWT-auth', // Security scheme adı
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown - NestJS handles cleanup automatically
  app.enableShutdownHooks();

  // SIGTERM/SIGINT handler - Graceful app shutdown
  process.on('SIGTERM', () => {
    void (async () => {
      logger.log('SIGTERM received, shutting down gracefully...');
      await app.close();
      logger.log('Application closed successfully');
      process.exit(0);
    })();
  });

  // Port seçimi
  const port = process.env.PORT;
  if (!port) {
    throw new Error(
      'PORT environment variable is required. Please set it in your .env file.',
    );
  }

  await app.listen(port);

  logger.log(`🚀 Server running on port ${port}`);
  logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}
void bootstrap();
