import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Swagger konfigürasyonu
  const config = new DocumentBuilder()
    .setTitle('Besin Denetle API')
    .setDescription('Besin Denetle mobil uygulama backend API dokümantasyonu')
    .setVersion('1.0')
    // API tag'leri (controller sırasına göre)
    .addTag('auth', 'Kimlik doğrulama işlemleri')
    .addTag('products', 'Ürün tarama ve yönetimi')
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

  // Port seçimi:
  // - PORT env variable varsa onu kullan
  // - PORT=0 ile dinamik port seçilebilir
  const port = process.env.PORT ?? 3200;
  await app.listen(port);

  logger.log(`🚀 Server running on port ${port}`);
  logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
