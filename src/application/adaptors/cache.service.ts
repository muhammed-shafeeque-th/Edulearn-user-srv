export abstract class ICacheService {
  abstract get<T = any>(key: string): Promise<T | null>;
  abstract set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
  abstract del(key: string): Promise<void>;
  abstract delByPattern(pattern: string): Promise<void>;
}
