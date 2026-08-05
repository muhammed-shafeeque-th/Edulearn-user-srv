import { ITraceService } from "@/application/adaptors/trace.service";

export interface MockSpan {
  setAttributes: jest.Mock;
  setAttribute: jest.Mock;
  recordException: jest.Mock;
  setStatus: jest.Mock;
  end: jest.Mock;
}

export interface MockTracingService {
  startActiveSpan: jest.Mock;
  startSpan: jest.Mock;
  endSpan: jest.Mock;
  recordException: jest.Mock;
  setStatus: jest.Mock;
  setAttribute: jest.Mock;
  getCurrentSpan: jest.Mock;
}

export function createMockSpan(): MockSpan {
  return {
    setAttributes: jest.fn(),
    setAttribute: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
    end: jest.fn(),
  };
}

export function createMockTracer(): jest.Mocked<ITraceService> {
  const span = createMockSpan();
  return {
    startActiveSpan: jest
      .fn()
      .mockImplementation((_name: string, fn: (span: MockSpan) => any) =>
        fn(span),
      ),
    startSpan: jest.fn().mockReturnValue(span),
    endSpan: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
    setAttribute: jest.fn(),
    getCurrentSpan: jest.fn().mockReturnValue(span),
  };
}
