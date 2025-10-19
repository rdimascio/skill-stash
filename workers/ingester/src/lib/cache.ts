/**
 * R2 Caching utilities
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export class CacheManager {
  constructor(private readonly r2: R2Bucket) {}

  /**
   * Get cached data
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const object = await this.r2.get(key);

      if (!object) {
        return null;
      }

      const text = await object.text();
      const cached = JSON.parse(text);

      // Check if expired
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        await this.delete(key);
        return null;
      }

      return cached.data as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T = any>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || 6 * 60 * 60; // Default 6 hours
      const expiresAt = Date.now() + ttl * 1000;

      const cached = {
        data,
        cachedAt: Date.now(),
        expiresAt,
      };

      await this.r2.put(key, JSON.stringify(cached), {
        httpMetadata: {
          contentType: 'application/json',
        },
      });
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      // Don't throw - caching is not critical
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      await this.r2.delete(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Check if cache exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Generate cache key for GitHub repo
   */
  static repoKey(owner: string, repo: string): string {
    return `github:repo:${owner}:${repo}`;
  }

  /**
   * Generate cache key for repo contents
   */
  static contentsKey(owner: string, repo: string, path: string): string {
    return `github:contents:${owner}:${repo}:${path}`;
  }

  /**
   * Generate cache key for search results
   */
  static searchKey(query: string, page: number): string {
    return `github:search:${query}:${page}`;
  }
}
