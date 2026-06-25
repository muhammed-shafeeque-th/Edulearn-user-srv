import { Repository, QueryBuilder } from "typeorm";

export const createMockRepository = <T>(): jest.Mocked<Repository<T>> => {
  return {
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
    exist: jest.fn(),
    insert: jest.fn(),
    upsert: jest.fn(),
    manager: {
      upsert: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    } as any,
  } as any;
};

export const createMockQueryBuilder = <T>(): jest.Mocked<QueryBuilder<T>> => {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
  } as any;
};

export const createMockRedisService = () => {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    expire: jest.fn(),
    getHash: jest.fn(),
    setHash: jest.fn(),
    deleteHash: jest.fn(),
    getAllHashes: jest.fn(),
    flushAll: jest.fn(),
  };
};

export const createMockLoggerService = () => {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  };
};

export const createMockTraceService = () => {
  return {
    startActiveSpan: jest.fn((name: string, fn: Function) =>
      fn({
        setAttributes: jest.fn(),
        setAttribute: jest.fn(),
        recordException: jest.fn(),
      }),
    ),
    recordException: jest.fn(),
  };
};

export const createMockMetricService = () => {
  return {
    incrementDBRequestCounter: jest.fn(),
    measureDBOperationDuration: jest.fn(() => jest.fn()),
    recordLatency: jest.fn(),
    recordCounter: jest.fn(),
    recordGauge: jest.fn(),
  };
};
