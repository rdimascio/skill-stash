import type { Context } from 'hono';

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function successResponse<T>(c: Context, data: T, status = 200) {
  return c.json(
    {
      success: true,
      data
    },
    status
  );
}

export function paginatedResponse<T>(
  c: Context,
  data: T[],
  pagination: PaginationInfo,
  status = 200
) {
  return c.json(
    {
      success: true,
      data,
      pagination
    },
    status
  );
}

export function errorResponse(c: Context, error: string, status = 500, details?: any) {
  const response: any = {
    success: false,
    error
  };

  if (details) {
    response.details = details;
  }

  return c.json(response, status);
}

export function calculatePagination(
  total: number,
  limit: number,
  offset: number
): PaginationInfo {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  };
}
