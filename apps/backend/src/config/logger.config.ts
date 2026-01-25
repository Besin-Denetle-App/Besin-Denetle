import * as winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Winston logger konfigürasyonu
 * - Category-based log filtering
 * - Separate security logs
 * - Daily rotation with compression
 * - Production-optimized settings
 */
export const createLoggerConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const transports: winston.transport[] = [
    // Console transport (development + production)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.ms(),
        winston.format.printf(({ level, message, timestamp, ms, context, category, metadata }) => {
          const appName = 'BesinDenetle';
          const ctx = context as any;
          const contextStr = ctx?.requestId ? `[${ctx.requestId}] ` : '';
          const metaStr = metadata ? ` - ${JSON.stringify({ category, metadata })}` : '';

          // Renk kodları (development için)
          const colors: Record<string, string> = {
            error: '\x1b[31m',
            warn: '\x1b[33m',
            info: '\x1b[32m',
            debug: '\x1b[36m',
          };
          const reset = '\x1b[0m';
          const color = isProduction ? '' : (colors[level] || '');
          const resetColor = isProduction ? '' : reset;

          const levelUpper = level.toUpperCase().padEnd(5);
          return `[${appName}] ${contextStr}${timestamp} ${color}${levelUpper}${resetColor} ${message}${metaStr} ${ms}`;
        }),
      ),
    }),
  ];

  // Production'da dosya logging
  if (isProduction) {
    // 1. App logs - business + database (security/http/error have dedicated files)
    transports.push(
      new winston.transports.DailyRotateFile({
        dirname: 'logs',
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m', // 20MB per file
        maxFiles: '14d', // 14 gün sakla
        zippedArchive: true, // gzip compression
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format((info) => {
            // Sadece business ve database loglarını al
            // security, http, error kendi dosyalarına gidiyor
            const category = info.category;
            return category === 'business' || category === 'database'
              ? info
              : false;
          })(),
        ),
      }),
    );

    // 2. Error logs - sadece hatalar
    transports.push(
      new winston.transports.DailyRotateFile({
        dirname: 'logs',
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d', // Hataları daha uzun sakla
        zippedArchive: true,
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );

    // 3. Security logs - güvenlik olayları için ayrı dosya
    transports.push(
      new winston.transports.DailyRotateFile({
        dirname: 'logs/security',
        filename: 'security-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '10m',
        maxFiles: '90d', // Güvenlik loglarını 3 ay sakla
        zippedArchive: true,
        // Sadece security category'sini logla
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format((info) => {
            // Sadece security category'si geçsin
            return info.category === 'security' ? info : false;
          })(),
        ),
      }),
    );

    // 4. HTTP logs - API request/response
    transports.push(
      new winston.transports.DailyRotateFile({
        dirname: 'logs/http',
        filename: 'http-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m', // HTTP logs daha büyük olabilir
        maxFiles: '7d', // 1 hafta yeterli
        zippedArchive: true,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format((info) => {
            return info.category === 'http' ? info : false;
          })(),
        ),
      }),
    );

    // 5. Infrastructure logs - sistem durumu (Redis, AI, vb.)
    transports.push(
      new winston.transports.DailyRotateFile({
        dirname: 'logs/infrastructure',
        filename: 'infrastructure-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d', // Sistem durumu için 1 ay sakla
        zippedArchive: true,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format((info) => {
            return info.category === 'infrastructure' ? info : false;
          })(),
        ),
      }),
    );
  }

  return {
    transports,
    // Global format options
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    ),
    // Log levels
    levels: winston.config.npm.levels,
  };
};
