export interface CacheOptions {
  ttlMs?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class ClientCacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;
  private defaultTtlMs = 5 * 60 * 1000; // 5 minutes default TTL

  public set<T>(key: string, value: T, options?: CacheOptions): void {
    const ttl = options?.ttlMs ?? this.defaultTtlMs;
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses += 1;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses += 1;
      return null;
    }

    this.hits += 1;
    return entry.value as T;
  }

  public invalidate(keyOrPrefix: string): void {
    if (this.cache.has(keyOrPrefix)) {
      this.cache.delete(keyOrPrefix);
      return;
    }

    // Prefix match invalidation
    Array.from(this.cache.keys()).forEach((k) => {
      if (k.startsWith(keyOrPrefix)) {
        this.cache.delete(k);
      }
    });
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getMetrics(): { hits: number; misses: number; size: number; hitRatio: number } {
    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? Math.round((this.hits / total) * 100) : 100;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRatio,
    };
  }
}

export const zolanzoCache = new ClientCacheManager();
