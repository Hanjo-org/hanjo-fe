/**
 * Paginasi, Urut, Filter, dan Cari
 * Referensi: MILESTONE.md §4.4
 *
 * Format query:
 *   GET /resource?page=1&per_page=25&sort=-created_at,name&q=kata
 *   Filter: filter[outlet_id]=...&filter[status]=submitted,approved
 *           filter[date_from]=2026-10-01&filter[date_to]=2026-10-31
 */

import type { ListEnvelope, PaginationMeta } from './types.js';

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

/** Permintaan paginasi dari client */
export interface PageRequest {
  page: number;
  per_page: number;
  sort?: SortField[];
  q?: string;
  filters?: Record<string, string | string[]>;
  include?: string[];
}

/** Satu field pengurutan */
export interface SortField {
  field: string;
  /** true = ascending (default), false = descending */
  asc: boolean;
}

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 25;
export const MAX_PER_PAGE = 100;

// ---------------------------------------------------------------------------
// Parser: query object → PageRequest
// ---------------------------------------------------------------------------

/**
 * Parse query object (dari URL atau ApiRequest.query) menjadi PageRequest.
 *
 * Contoh query:
 * { page: 2, per_page: 10, sort: '-created_at,name', q: 'susu',
 *   'filter[outlet_id]': 'abc', 'filter[status]': 'submitted,approved',
 *   include: 'lines,supplier' }
 */
export function parsePageRequest(query?: Record<string, unknown>): PageRequest {
  if (!query) {
    return { page: DEFAULT_PAGE, per_page: DEFAULT_PER_PAGE };
  }

  const page = clampInt(query.page, DEFAULT_PAGE, 1);
  const per_page = clampInt(query.per_page, DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
  const sort = parseSort(query.sort as string | undefined);
  const q = typeof query.q === 'string' ? query.q.trim() : undefined;
  const filters = parseFilters(query);
  const include = parseInclude(query.include as string | undefined);

  return {
    page,
    per_page,
    ...(sort && sort.length > 0 ? { sort } : {}),
    ...(q ? { q } : {}),
    ...(Object.keys(filters).length > 0 ? { filters } : {}),
    ...(include && include.length > 0 ? { include } : {}),
  };
}

// ---------------------------------------------------------------------------
// Sort parser: "-created_at,name" → [{ field: 'created_at', asc: false }, ...]
// ---------------------------------------------------------------------------

function parseSort(raw?: string): SortField[] | undefined {
  if (!raw) return undefined;
  return raw.split(',').map((s) => {
    const trimmed = s.trim();
    if (trimmed.startsWith('-')) {
      return { field: trimmed.slice(1), asc: false };
    }
    return { field: trimmed, asc: true };
  });
}

// ---------------------------------------------------------------------------
// Filter parser: "filter[outlet_id]=abc" → { outlet_id: "abc" }
// ---------------------------------------------------------------------------

function parseFilters(query: Record<string, unknown>): Record<string, string | string[]> {
  const filters: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(query)) {
    const match = key.match(/^filter\[(.+)]$/);
    if (match && typeof value === 'string') {
      const filterKey = match[1];
      // "submitted,approved" → ["submitted", "approved"]
      if (value.includes(',')) {
        filters[filterKey] = value.split(',').map((v) => v.trim());
      } else {
        filters[filterKey] = value;
      }
    }
  }
  return filters;
}

// ---------------------------------------------------------------------------
// Include parser: "lines,supplier" → ["lines", "supplier"]
// ---------------------------------------------------------------------------

function parseInclude(raw?: string): string[] | undefined {
  if (!raw) return undefined;
  return raw.split(',').map((s) => s.trim());
}

// ---------------------------------------------------------------------------
// Helper: bangun ListEnvelope dari data yang sudah dipaginasi
// ---------------------------------------------------------------------------

/**
 * Bangun ListEnvelope<T> dari array penuh dan PageRequest.
 * Melakukan slicing array, menghitung meta.
 */
export function paginateArray<T>(items: T[], req: PageRequest): ListEnvelope<T> {
  const total = items.length;
  const total_pages = Math.max(1, Math.ceil(total / req.per_page));
  const page = Math.min(req.page, total_pages);
  const start = (page - 1) * req.per_page;
  const end = start + req.per_page;

  return {
    data: items.slice(start, end),
    meta: {
      page,
      per_page: req.per_page,
      total,
      total_pages,
    },
  };
}

/**
 * Bangun ListEnvelope<T> dari data yang sudah dipotong + info total.
 * Untuk kasus di mana paginasi dilakukan di level query (server-side).
 */
export function buildListEnvelope<T>(
  data: T[],
  meta: PaginationMeta
): ListEnvelope<T> {
  return { data, meta };
}

// ---------------------------------------------------------------------------
// Sorting helper
// ---------------------------------------------------------------------------

/**
 * Sort array berdasarkan SortField[].
 * Mendukung nested field menggunakan dot notation (mis. "supplier.name").
 */
export function sortArray<T>(items: T[], sortFields?: SortField[]): T[] {
  if (!sortFields || sortFields.length === 0) return items;

  return [...items].sort((a, b) => {
    for (const { field, asc } of sortFields) {
      const va = getNestedValue(a, field);
      const vb = getNestedValue(b, field);

      let cmp = 0;
      if (va == null && vb == null) cmp = 0;
      else if (va == null) cmp = -1;
      else if (vb == null) cmp = 1;
      else if (typeof va === 'string' && typeof vb === 'string') {
        cmp = va.localeCompare(vb, 'id');
      } else if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), 'id');
      }

      if (cmp !== 0) return asc ? cmp : -cmp;
    }
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Utilitas internal
// ---------------------------------------------------------------------------

function clampInt(
  value: unknown,
  defaultValue: number,
  min: number,
  max?: number
): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (isNaN(n)) return defaultValue;
  const clamped = Math.max(min, n);
  return max !== undefined ? Math.min(max, clamped) : clamped;
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current == null || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj);
}
