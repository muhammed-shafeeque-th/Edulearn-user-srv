import CheckEmailExistUseCaseImpl from "@/application/use-cases/profile/impls/email-exist.use-case";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { createMockUser } from "test/fixtures";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("CheckEmailExistUseCaseImpl", () => {
  let useCase: CheckEmailExistUseCaseImpl;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new CheckEmailExistUseCaseImpl(userRepo, logger, tracer);
  });

  it("should return true when email exists", async () => {
    const mockUser = createMockUser({ email: "test@example.com" });
    userRepo.findByEmail.mockResolvedValue(mockUser);

    const result = await useCase.execute({ email: "test@example.com" });

    expect(result).toBe(true);
    expect(userRepo.findByEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("should return false when email does not exist", async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({
      email: "nonexistent@example.com",
    } as any);

    expect(result).toBe(false);
    expect(userRepo.findByEmail).toHaveBeenCalledWith(
      "nonexistent@example.com",
    );
  });

  it("should check email with different cases", async () => {
    const mockUser = createMockUser({ email: "test@example.com" });
    userRepo.findByEmail.mockResolvedValue(mockUser);

    const result = await useCase.execute({ email: "Test@Example.com" } as any);

    expect(userRepo.findByEmail).toHaveBeenCalledWith("Test@Example.com");
  });

  it("should handle repository errors", async () => {
    userRepo.findByEmail.mockRejectedValue(new Error("Database error"));

    await expect(
      useCase.execute({ email: "test@example.com" } as any),
    ).rejects.toThrow("Database error");
  });

  it("should log the operation", async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await useCase.execute({ email: "test@example.com" } as any);

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should use tracer for span", async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await useCase.execute({ email: "test@example.com" } as any);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });
});
