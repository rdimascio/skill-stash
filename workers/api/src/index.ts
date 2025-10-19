import { Hono } from 'hono';
import { corsMiddleware, securityHeaders } from './middleware/cors';
import { errorHandler } from './middleware/error-handler';
import pluginsRouter from './routes/plugins';
import componentsRouter from './routes/components';
import discoveryRouter from './routes/discovery';
import statsRouter from './routes/stats';
import type { worker as Worker } from '../alchemy.run';

const app = new Hono<{ Bindings: typeof Worker.Env }>();

// Apply global middleware
app.use('*', corsMiddleware);
app.use('*', securityHeaders());
app.use('*', errorHandler);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
    version: '1.0.0',
  });
});

// Mount API routes
app.route('/api/plugins', pluginsRouter);
app.route('/api', componentsRouter);
app.route('/api', discoveryRouter);
app.route('/api/stats', statsRouter);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Endpoint not found',
    },
    404
  );
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: 'Internal server error',
    },
    500
  );
});

export default app;
