import { ICacheService } from "@/application/adaptors/cache.service";

export interface MockRedisService {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  delByPattern: jest.Mock;
}

export function createMockCacheService(): jest.Mocked<ICacheService> {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delByPattern: jest.fn().mockResolvedValue(undefined),
  };
}
