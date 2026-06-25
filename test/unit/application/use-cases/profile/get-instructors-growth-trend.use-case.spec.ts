import GetInstructorsGrowthTrendUseCase from "@/application/use-cases/profile/impls/get-instructors-growth-trend.use-case";
import {
  GrowthTrend,
  IUserRepository,
} from "@/domain/repositories/user.repository";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("GetInstructorsGrowthTrendUseCase", () => {
  let useCase: GetInstructorsGrowthTrendUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetInstructorsGrowthTrendUseCase(userRepo, logger, tracer);
  });

  it("should return growth trend for given year", async () => {
    const mockTrend = {
      data: [
        { month: 1, count: 10 },
        { month: 2, count: 15 },
        { month: 3, count: 20 },
      ],
      year: 2024,
    };
    userRepo.getInstructorsGrowthTrend.mockResolvedValue(mockTrend as any);

    const result = await useCase.execute(2024);

    expect(result).toBeDefined();
    expect(userRepo.getInstructorsGrowthTrend).toHaveBeenCalledWith(2024);
  });

  it("should handle year 2024", async () => {
    const mockTrend = { trend: [] };
    userRepo.getInstructorsGrowthTrend.mockResolvedValue(mockTrend);

    const result = await useCase.execute(2024);

    expect(result.trend).toBeDefined();
  });

  it("should handle year 2023", async () => {
    const mockTrend: GrowthTrend = { trend: [{ count: 2, month: 1 }] };
    userRepo.getInstructorsGrowthTrend.mockResolvedValue(mockTrend as any);

    const result = await useCase.execute(2023);

    expect(result).toBeInstanceOf(Object);
  });

  it("should return data with monthly breakdown", async () => {
    const mockTrend: GrowthTrend = {
      trend: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        count: 10 + i,
      })),
    };
    userRepo.getInstructorsGrowthTrend.mockResolvedValue(mockTrend as any);

    const result = await useCase.execute(2024);

    expect(result.trend).toHaveLength(12);
  });

  it("should return zero data when no growth", async () => {
    const mockTrend: GrowthTrend = {
      trend: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        count: 0,
      })),
    };
    userRepo.getInstructorsGrowthTrend.mockResolvedValue(mockTrend as any);

    const result = await useCase.execute(2024);

    expect(result.trend).toBeDefined();
    expect(result.trend.every((d) => d.count === 0)).toBe(true);
  });

  it("should log trend retrieval", async () => {
    const mockTrend = { data: [], year: 2024 };
    userRepo.getInstructorsGrowthTrend.mockResolvedValue(mockTrend as any);

    await useCase.execute(2024);

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should use tracer for span", async () => {
    const mockTrend = { data: [], year: 2024 };
    userRepo.getInstructorsGrowthTrend.mockResolvedValue(mockTrend as any);

    await useCase.execute(2024);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    userRepo.getInstructorsGrowthTrend.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(useCase.execute(2024)).rejects.toThrow("Database error");
    expect(logger.error).toHaveBeenCalled();
  });

  it("should log errors appropriately", async () => {
    const error = new Error("Repository error");
    userRepo.getInstructorsGrowthTrend.mockRejectedValue(error);

    try {
      await useCase.execute(2024);
    } catch {
      // Expected
    }

    expect(logger.error).toHaveBeenCalled();
  });
});
