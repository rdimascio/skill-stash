import type { Context } from 'hono';

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export async function errorHandler(c: Context, next: () => Promise<void>): Promise<Response | void> {
  try {
    await next();
  } catch (err) {
    console.error('API Error:', err);

    if (err instanceof NotFoundError) {
      return c.json(
        {
          success: false,
          error: err.message
        },
        404
      );
    }

    if (err instanceof ValidationError) {
      return c.json(
        {
          success: false,
          error: err.message,
          details: err.details
        },
        400
      );
    }

    if (err instanceof BadRequestError) {
      return c.json(
        {
          success: false,
          error: err.message
        },
        400
      );
    }

    // Unknown error
    return c.json(
      {
        success: false,
        error: 'Internal server error'
      },
      500
    );
  }
}
