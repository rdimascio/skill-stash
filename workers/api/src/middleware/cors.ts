import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: (origin) => {
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin;
    }
    // Allow production domain
    if (origin === 'https://skillstash.com' || origin === 'https://www.skillstash.com') {
      return origin;
    }
    // Default allow for development
    return origin;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400
});

export function securityHeaders() {
  return async (c: any, next: () => Promise<void>) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  };
}
