import GetUsersStatsUseCase from "@/application/use-cases/profile/impls/get-users-stats.use-case";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("GetUsersStatsUseCase", () => {
  let useCase: GetUsersStatsUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetUsersStatsUseCase(userRepo, logger as any, tracer as any);
  });

  it("should return users statistics", async () => {
    const mockStats = {
      total: 500,
      active: 450,
      inactive: 30,
      blocked: 20,
    };
    userRepo.getUsersStats.mockResolvedValue(mockStats as any);

    const result = await useCase.execute();

    expect(result).toBeDefined();
    expect(result.total).toBe(500);
    expect(result.active).toBe(450);
    expect(userRepo.getUsersStats).toHaveBeenCalled();
  });

  it("should return zero statistics when no users", async () => {
    const mockStats = {
      total: 0,
      active: 0,
      inactive: 0,
      blocked: 0,
    };
    userRepo.getUsersStats.mockResolvedValue(mockStats as any);

    const result = await useCase.execute();

    expect(result.total).toBe(0);
    expect(result.active).toBe(0);
  });

  it("should include all status categories", async () => {
    const mockStats = {
      total: 1000,
      active: 800,
      inactive: 150,
      blocked: 50,
    };
    userRepo.getUsersStats.mockResolvedValue(mockStats as any);

    const result = await useCase.execute();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("active");
    expect(result).toHaveProperty("inactive");
    expect(result).toHaveProperty("blocked");
  });

  it("should verify total equals sum of categories", async () => {
    const mockStats = {
      total: 1000,
      active: 800,
      inactive: 150,
      blocked: 50,
    };
    userRepo.getUsersStats.mockResolvedValue(mockStats as any);

    const result = await useCase.execute();

    expect(result.total).toBe(result.active + result.inactive + result.blocked);
  });

  it("should log stats retrieval", async () => {
    const mockStats = {
      total: 100,
      active: 80,
      inactive: 15,
      blocked: 5,
    };
    userRepo.getUsersStats.mockResolvedValue(mockStats as any);

    await useCase.execute();

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should use tracer for span", async () => {
    const mockStats = {
      total: 100,
      active: 80,
      inactive: 15,
      blocked: 5,
    };
    userRepo.getUsersStats.mockResolvedValue(mockStats as any);

    await useCase.execute();

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    userRepo.getUsersStats.mockRejectedValue(new Error("Database error"));

    await expect(useCase.execute()).rejects.toThrow("Database error");
    expect(logger.error).toHaveBeenCalled();
  });

  it("should log errors appropriately", async () => {
    const error = new Error("Repository error");
    userRepo.getUsersStats.mockRejectedValue(error);

    try {
      await useCase.execute();
    } catch {
      // Expected
    }

    expect(logger.error).toHaveBeenCalled();
  });

  it("should handle high user counts", async () => {
    const mockStats = {
      total: 1000000,
      active: 900000,
      inactive: 80000,
      blocked: 20000,
    };
    userRepo.getUsersStats.mockResolvedValue(mockStats as any);

    const result = await useCase.execute();

    expect(result.total).toBe(1000000);
  });
});
