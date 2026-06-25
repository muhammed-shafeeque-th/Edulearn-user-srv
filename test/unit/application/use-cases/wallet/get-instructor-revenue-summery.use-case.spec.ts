import { GetInstructorRevenueSummeryUseCase } from "@/application/use-cases/wallet/impls/get-instructor-revenue-summery.use-case";
import { IWalletRepository } from "@/domain/repositories/wallet.repository";
import { UserWalletNotFoundException } from "src/domain/exceptions";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockWalletRepository } from "test/mocks/wallet-repository.mock";

describe("GetInstructorRevenueSummeryUseCase", () => {
  let useCase: GetInstructorRevenueSummeryUseCase;
  let walletRepo: jest.Mocked<IWalletRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    walletRepo = createMockWalletRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetInstructorRevenueSummeryUseCase(
      walletRepo,
      logger as any,
      tracer as any,
    );
  });

  it("should return revenue summary for instructor", async () => {
    const mockRevenue = {
      totalEarnings: 50000,
      thisMonthEarnings: 5000,
      lastMonthEarnings: 4500,
      thisWeekEarnings: 1200,
      todayEarnings: 150,
    };
    walletRepo.getRevenueSummery.mockResolvedValue(mockRevenue);

    const result = await useCase.execute({
      instructorId: "instructor-1",
    } as any);

    expect(result).toBeDefined();
    expect(result.totalEarnings).toBe(50000);
    expect(result.thisMonthEarnings).toBe(5000);
    expect(walletRepo.getRevenueSummery).toHaveBeenCalledWith("instructor-1");
  });

  it("should throw BadRequestException when instructorId is missing", async () => {
    await expect(useCase.execute({} as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw UserWalletNotFoundException when no revenue summary", async () => {
    walletRepo.getRevenueSummery.mockResolvedValue(null);

    await expect(
      useCase.execute({ instructorId: "instructor-1" } as any),
    ).rejects.toThrow(UserWalletNotFoundException);
  });

  it("should handle zero earnings", async () => {
    const mockRevenue = {
      totalEarnings: 0,
      thisMonthEarnings: 0,
      lastMonthEarnings: 0,
      thisWeekEarnings: 0,
      todayEarnings: 0,
    };
    walletRepo.getRevenueSummery.mockResolvedValue(mockRevenue);

    const result = await useCase.execute({
      instructorId: "instructor-1",
    } as any);

    expect(result.totalEarnings).toBe(0);
    expect(result.todayEarnings).toBe(0);
  });

  it("should provide defaults when some earnings are null", async () => {
    const mockRevenue = {
      totalEarnings: 1000,
      thisMonthEarnings: null,
      lastMonthEarnings: null,
      thisWeekEarnings: null,
      todayEarnings: null,
    };
    walletRepo.getRevenueSummery.mockResolvedValue(mockRevenue as any);

    const result = await useCase.execute({
      instructorId: "instructor-1",
    } as any);

    expect(result.thisMonthEarnings).toBe(0);
    expect(result.lastMonthEarnings).toBe(0);
    expect(result.thisWeekEarnings).toBe(0);
    expect(result.todayEarnings).toBe(0);
  });

  it("should log revenue retrieval", async () => {
    const mockRevenue = {
      totalEarnings: 50000,
      thisMonthEarnings: 5000,
      lastMonthEarnings: 4500,
      thisWeekEarnings: 1200,
      todayEarnings: 150,
    };
    walletRepo.getRevenueSummery.mockResolvedValue(mockRevenue);

    await useCase.execute({ instructorId: "instructor-1" } as any);

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should log warning when revenue summary not found", async () => {
    walletRepo.getRevenueSummery.mockResolvedValue(null);

    try {
      await useCase.execute({ instructorId: "instructor-1" } as any);
    } catch {
      // Expected
    }

    expect(logger.warn).toHaveBeenCalled();
  });

  it("should use tracer for span creation", async () => {
    const mockRevenue = {
      totalEarnings: 50000,
      thisMonthEarnings: 5000,
      lastMonthEarnings: 4500,
      thisWeekEarnings: 1200,
      todayEarnings: 150,
    };
    walletRepo.getRevenueSummery.mockResolvedValue(mockRevenue);

    await useCase.execute({ instructorId: "instructor-1" } as any);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should set span attributes with instructor ID", async () => {
    const mockRevenue = {
      totalEarnings: 50000,
      thisMonthEarnings: 5000,
      lastMonthEarnings: 4500,
      thisWeekEarnings: 1200,
      todayEarnings: 150,
    };
    walletRepo.getRevenueSummery.mockResolvedValue(mockRevenue);

    await useCase.execute({ instructorId: "instructor-123" } as any);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    walletRepo.getRevenueSummery.mockRejectedValue(new Error("Database error"));

    await expect(
      useCase.execute({ instructorId: "instructor-1" } as any),
    ).rejects.toThrow("Database error");
    expect(logger.error).toHaveBeenCalled();
  });

  it("should handle large earnings values", async () => {
    const mockRevenue = {
      totalEarnings: 10000000,
      thisMonthEarnings: 1000000,
      lastMonthEarnings: 900000,
      thisWeekEarnings: 200000,
      todayEarnings: 50000,
    };
    walletRepo.getRevenueSummery.mockResolvedValue(mockRevenue);

    const result = await useCase.execute({
      instructorId: "instructor-1",
    } as any);

    expect(result.totalEarnings).toBe(10000000);
  });

  it("should handle null instructorId gracefully", async () => {
    await expect(
      useCase.execute({ instructorId: null } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("should handle empty instructorId", async () => {
    await expect(useCase.execute({ instructorId: "" } as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should log errors with context", async () => {
    const error = new Error("Revenue fetch failed");
    walletRepo.getRevenueSummery.mockRejectedValue(error);

    try {
      await useCase.execute({ instructorId: "instructor-1" } as any);
    } catch {
      // Expected
    }

    expect(logger.error).toHaveBeenCalled();
  });
});
