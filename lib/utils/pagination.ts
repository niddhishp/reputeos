/**
 * Pagination Utilities
 * 
 * This module provides cursor-based pagination for Supabase queries.
 * Cursor-based pagination is more efficient than offset-based for large datasets.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface PaginationParams {
  cursor?: string;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Create a paginated query for Supabase
 */
export async function paginate<T>(
  client: SupabaseClient,
  table: string,
  params: PaginationParams & {
    filters?: (query: any) => any;
    select?: string;
  }
): Promise<PaginatedResult<T>> {
  const {
    cursor,
    pageSize = 20,
    orderBy = 'created_at',
    orderDirection = 'desc',
    filters,
    select = '*',
  } = params;

  let query = client
    .from(table)
    .select(select, { count: 'exact' })
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .limit(pageSize + 1); // Fetch one extra to determine if there's a next page

  // Apply cursor filter
  if (cursor) {
    const operator = orderDirection === 'desc' ? 'lt' : 'gt';
    query = query[operator](orderBy, cursor);
  }

  // Apply custom filters
  if (filters) {
    query = filters(query);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  const items = data || [];
  const hasMore = items.length > pageSize;

  // Remove the extra item we fetched
  const paginatedItems = hasMore ? items.slice(0, pageSize) : items;

  // Get the next cursor from the last item
  const nextCursor = hasMore
    ? (paginatedItems[paginatedItems.length - 1] as Record<string, unknown>)[orderBy] as string
    : null;

  return {
    items: paginatedItems as T[],
    nextCursor,
    hasMore,
    totalCount: count || undefined,
  };
}

/**
 * Create pagination response with metadata
 */
export function createPaginationResponse<T>(
  items: T[],
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  }
): {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
} {
  const { page, pageSize, totalCount } = pagination;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: items,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Parse pagination parameters from request URL
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { pageSize?: number; maxPageSize?: number } = {}
): { page: number; pageSize: number } {
  const { pageSize: defaultPageSize = 20, maxPageSize = 100 } = defaults;

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const requestedPageSize = parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10);
  const pageSize = Math.min(Math.max(1, requestedPageSize), maxPageSize);

  return { page, pageSize };
}

/**
 * Calculate offset for traditional pagination
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
