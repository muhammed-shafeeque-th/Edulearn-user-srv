import CurrentUserUseCaseImpl from "@/application/use-cases/profile/impls/current-user.usecase";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { UserNotFoundException } from "src/domain/exceptions";
import { createMockUser } from "test/fixtures";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("CurrentUserUseCaseImpl", () => {
  let useCase: CurrentUserUseCaseImpl;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new CurrentUserUseCaseImpl(
      userRepo,
      logger as any,
      tracer as any,
    );
  });

  it("should return current user data when found", async () => {
    const mockUser = createMockUser({ id: "current-user" });
    userRepo.findById.mockResolvedValue(mockUser);

    const result = await useCase.execute({ userId: "current-user" } as any);

    expect(result).toBeDefined();
    expect(result.id).toBe("current-user");
    expect(userRepo.findById).toHaveBeenCalledWith("current-user");
  });

  it("should throw UserNotFoundException when user not found", async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: "non-existent" } as any),
    ).rejects.toThrow(UserNotFoundException);
  });

  it("should return user with all properties mapped correctly", async () => {
    const mockUser = createMockUser({
      id: "user-123",
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
    });
    userRepo.findById.mockResolvedValue(mockUser);

    const result = await useCase.execute({ userId: "user-123" } as any);

    expect(result.id).toBe("user-123");
    expect(result.email).toBe("john@example.com");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
  });

  it("should log user retrieval", async () => {
    const mockUser = createMockUser();
    userRepo.findById.mockResolvedValue(mockUser);

    await useCase.execute({ userId: "user-123" } as any);

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should log error when user not found", async () => {
    userRepo.findById.mockResolvedValue(null);

    try {
      await useCase.execute({ userId: "user-123" } as any);
    } catch {
      // Expected
    }

    expect(logger.error).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    userRepo.findById.mockRejectedValue(new Error("Database error"));

    await expect(
      useCase.execute({ userId: "user-123" } as any),
    ).rejects.toThrow("Database error");
  });

  it("should use tracer for span creation", async () => {
    const mockUser = createMockUser();
    userRepo.findById.mockResolvedValue(mockUser);

    await useCase.execute({ userId: "user-123" } as any);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });
});
