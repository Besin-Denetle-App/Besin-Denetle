import { Request } from 'express';

/**
 * Cloudflare uyumlu IP adresi alma helper'ı.
 * Cloudflare headers, X-Forwarded-For ve direkt IP'yi kontrol eder.
 */
export function getClientIp(req: Request): string {
  // Cloudflare IP header'ı
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    return Array.isArray(cfIp) ? cfIp[0] : cfIp;
  }

  // X-Forwarded-For header'ı
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ip.split(',')[0].trim();
  }

  // Direkt IP
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
