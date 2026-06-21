import { ILoggerService } from "@/application/adaptors/logger.service";

export interface MockLoggingService {
  log: jest.Mock;
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
}

export function createMockLogger(): jest.Mocked<ILoggerService> {
  return {
    log: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
}
