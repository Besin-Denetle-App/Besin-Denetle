import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Winston logger konfigürasyonu.
 * - Geliştirme ortamında console'a renkli çıktı
 * - Production'da günlük dosyalara yazma (50MB, 30 gün saklama, gzip sıkıştırma)
 */
export const createLoggerConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const transports: winston.transport[] = [
    // Console transport (her zaman aktif)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('BesinDenetle', {
          colors: !isProduction,
          prettyPrint: !isProduction,
        }),
      ),
    }),
  ];

  // Production'da dosyaya da yaz
  if (isProduction) {
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: 'logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m', // Dosya başına max 50MB
        maxFiles: '30d', // 30 gün sakla, eskilerini sil
        zippedArchive: true, // Eski logları gzip ile sıkıştır
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      // Sadece hatalar için ayrı dosya
      new winston.transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m',
        maxFiles: '30d',
        zippedArchive: true,
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  }

  return {
    transports,
  };
};
