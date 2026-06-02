type RequestCacheEntry<T> = {
  promise: Promise<T>
  result?: T
}

const requestCache = new Map<string, RequestCacheEntry<unknown>>()

export function getOrCreateRequest<T>(
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  const existing = requestCache.get(key) as RequestCacheEntry<T> | undefined

  if (existing?.result !== undefined) {
    return Promise.resolve(existing.result)
  }

  if (existing) {
    return existing.promise
  }

  const entry: RequestCacheEntry<T> = {
    promise: factory().then(
      (result) => {
        entry.result = result
        return result
      },
      (error) => {
        requestCache.delete(key)
        throw error
      }
    ),
  }

  requestCache.set(key, entry as RequestCacheEntry<unknown>)
  return entry.promise
}

export function invalidateRequestCache(key: string): void {
  requestCache.delete(key)
}

export function invalidateRequestCacheByPrefix(prefix: string): void {
  for (const key of requestCache.keys()) {
    if (key.startsWith(prefix)) {
      requestCache.delete(key)
    }
  }
}
