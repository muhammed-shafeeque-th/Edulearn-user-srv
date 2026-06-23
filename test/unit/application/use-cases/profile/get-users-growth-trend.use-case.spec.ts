import GetUsersGrowthTrendUseCase from "@/application/use-cases/profile/impls/get-users-growth-trend.use-case";
import {
  GrowthTrend,
  IUserRepository,
} from "@/domain/repositories/user.repository";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("GetUsersGrowthTrendUseCase", () => {
  let useCase: GetUsersGrowthTrendUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetUsersGrowthTrendUseCase(
      userRepo,
      logger,
      tracer,
    );
  });

  it("should return growth trend for given year", async () => {
    const mockTrend: GrowthTrend = {
      trend: [
        { month: 1, count: 50 },
        { month: 2, count: 75 },
        { month: 3, count: 100 },
      ],
    };
    userRepo.getUsersGrowthTrend.mockResolvedValue(mockTrend);

    const result = await useCase.execute(2024);

    expect(result).toBeDefined();
    expect(userRepo.getUsersGrowthTrend).toHaveBeenCalledWith(2024);
  });

  it("should handle year 2024", async () => {
    const mockTrend = { trend: [] };
    userRepo.getUsersGrowthTrend.mockResolvedValue(mockTrend);

    const result = await useCase.execute(2024);

    expect(result.trend).toBeInstanceOf(Array);
  });

  it("should handle year 2023", async () => {
    const mockTrend: GrowthTrend = { trend: [] };
    userRepo.getUsersGrowthTrend.mockResolvedValue(mockTrend);

    const result = await useCase.execute(2023);

    expect(result.trend).toBeInstanceOf(Array);
  });

  it("should return data with monthly breakdown", async () => {
    const mockTrend: GrowthTrend = {
      trend: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        count: 50 + i * 10,
      })),
    };
    userRepo.getUsersGrowthTrend.mockResolvedValue(mockTrend);

    const result = await useCase.execute(2024);

    expect(result.trend).toHaveLength(12);
    expect(result.trend[0]).toEqual({ month: 1, count: 50 });
  });

  it("should return zero data when no growth", async () => {
    const mockTrend = {
      trend: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        count: 0,
      })),
    };
    userRepo.getUsersGrowthTrend.mockResolvedValue(mockTrend);

    const result = await useCase.execute(2024);

    expect(result.trend).toBeDefined();
    expect(result.trend.every((d: any) => d.count === 0)).toBe(true);
  });

  it("should handle continuous growth", async () => {
    const mockTrend = {
      trend: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        count: (i + 1) * 100,
      })),
    };
    userRepo.getUsersGrowthTrend.mockResolvedValue(mockTrend);

    const result = await useCase.execute(2024);

    expect(result.trend[0].count).toBeLessThan(result.trend[11].count);
  });

  it("should log trend retrieval", async () => {
    const mockTrend = { trend: [] };
    userRepo.getUsersGrowthTrend.mockResolvedValue(mockTrend);

    await useCase.execute(2024);

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should use tracer for span", async () => {
    const mockTrend = { trend: [] };
    userRepo.getUsersGrowthTrend.mockResolvedValue(mockTrend);

    await useCase.execute(2024);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    userRepo.getUsersGrowthTrend.mockRejectedValue(new Error("Database error"));

    await expect(useCase.execute(2024)).rejects.toThrow("Database error");
    expect(logger.error).toHaveBeenCalled();
  });

  it("should log errors appropriately", async () => {
    const error = new Error("Repository error");
    userRepo.getUsersGrowthTrend.mockRejectedValue(error);

    try {
      await useCase.execute(2024);
    } catch {
      // Expected
    }

    expect(logger.error).toHaveBeenCalled();
  });
});
