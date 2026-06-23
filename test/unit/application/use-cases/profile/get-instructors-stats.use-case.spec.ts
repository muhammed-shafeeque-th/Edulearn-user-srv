import GetInstructorsStatsUseCase from "@/application/use-cases/profile/impls/get-instructors-stats.use-case";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("GetInstructorsStatsUseCase", () => {
  let useCase: GetInstructorsStatsUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetInstructorsStatsUseCase(userRepo, logger, tracer);
  });

  it("should return instructors statistics", async () => {
    const mockStats = {
      total: 150,
      active: 120,
      inactive: 20,
      blocked: 10,
      newThisMonth: 5,
    };
    userRepo.getInstructorsStats.mockResolvedValue(mockStats as any);

    const result = await useCase.execute();

    expect(result).toBeDefined();
    expect(result.total).toBe(150);
    expect(result.active).toBe(120);
    expect(userRepo.getInstructorsStats).toHaveBeenCalled();
  });

  it("should return zero statistics when no instructors", async () => {
    const mockStats = {
      total: 0,
      active: 0,
      inactive: 0,
      blocked: 0,
      newThisMonth: 0,
    };
    userRepo.getInstructorsStats.mockResolvedValue(mockStats as any);

    const result = await useCase.execute();

    expect(result.total).toBe(0);
    expect(result.active).toBe(0);
  });

  it("should include all status categories", async () => {
    const mockStats = {
      total: 100,
      active: 80,
      inactive: 15,
      blocked: 5,
      newThisMonth: 10,
    };
    userRepo.getInstructorsStats.mockResolvedValue(mockStats as any);

    const result = await useCase.execute();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("active");
    expect(result).toHaveProperty("inactive");
    expect(result).toHaveProperty("blocked");
    expect(result).toHaveProperty("newThisMonth");
  });

  it("should log stats retrieval", async () => {
    const mockStats = {
      total: 100,
      active: 80,
      inactive: 15,
      blocked: 5,
      newThisMonth: 10,
    };
    userRepo.getInstructorsStats.mockResolvedValue(mockStats as any);

    await useCase.execute();

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    userRepo.getInstructorsStats.mockRejectedValue(new Error("Database error"));

    await expect(useCase.execute()).rejects.toThrow("Database error");
    expect(logger.error).toHaveBeenCalled();
  });

  it("should use tracer for span", async () => {
    const mockStats = {
      total: 100,
      active: 80,
      inactive: 15,
      blocked: 5,
      newThisMonth: 10,
    };
    userRepo.getInstructorsStats.mockResolvedValue(mockStats as any);

    await useCase.execute();

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should log errors appropriately", async () => {
    const error = new Error("Repository error");
    userRepo.getInstructorsStats.mockRejectedValue(error);

    try {
      await useCase.execute();
    } catch {
      // Expected
    }

    expect(logger.error).toHaveBeenCalled();
  });
});
