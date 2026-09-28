/**
 * Query Key Factory — centralized, typed keys for all queries.
 *
 * Why: TanStack Query caching and invalidation relies on query keys.
 * Centralizing them avoids key typos and makes invalidation predictable.
 *
 * Usage:
 *   queryKeys.auth.me()                    → ["auth", "me"]
 *   queryKeys.procurement.all()            → ["procurement"]
 *   queryKeys.procurement.detail("REQ-1") → ["procurement", "REQ-1"]
 */
export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  settings: {
    all: () => ["settings"] as const,
  },
  procurement: {
    all: () => ["procurement"] as const,
    detail: (id: string) => ["procurement", id] as const,
  },
  documents: {
    all: () => ["documents"] as const,
    byRequest: (requestId: string) => ["documents", "byRequest", requestId] as const,
    detail: (id: string) => ["documents", id] as const,
  },
  guarantees: {
    all: () => ["guarantees"] as const,
    byRequest: (requestId: string) => ["guarantees", "byRequest", requestId] as const,
    detail: (id: string) => ["guarantees", id] as const,
  },
  deadlines: {
    all: () => ["deadlines"] as const,
    byRequest: (requestId: string) => ["deadlines", "byRequest", requestId] as const,
    detail: (id: string) => ["deadlines", id] as const,
  },
} as const;
