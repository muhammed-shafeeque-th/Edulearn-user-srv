import GetAllEmailsUseCaseImpl from "@/application/use-cases/profile/impls/get-emails.use-case";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("GetAllEmailsUseCaseImpl", () => {
  let useCase: GetAllEmailsUseCaseImpl;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetAllEmailsUseCaseImpl(
      userRepo,
      logger as any,
      tracer as any,
    );
  });

  it("should return all user emails", async () => {
    const mockEmails = [
      "user1@example.com",
      "user2@example.com",
      "user3@example.com",
    ];
    userRepo.findAllUsersEmail.mockResolvedValue(mockEmails);

    const result = await useCase.execute();

    expect(result).toHaveLength(3);
    expect(result).toEqual(mockEmails);
    expect(userRepo.findAllUsersEmail).toHaveBeenCalled();
  });

  it("should return empty array when no users exist", async () => {
    userRepo.findAllUsersEmail.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should handle single email", async () => {
    userRepo.findAllUsersEmail.mockResolvedValue(["single@example.com"]);

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]).toBe("single@example.com");
  });

  it("should handle many emails", async () => {
    const mockEmails = Array.from(
      { length: 1000 },
      (_, i) => `user${i}@example.com`,
    );
    userRepo.findAllUsersEmail.mockResolvedValue(mockEmails);

    const result = await useCase.execute();

    expect(result).toHaveLength(1000);
    expect(userRepo.findAllUsersEmail).toHaveBeenCalled();
  });

  it("should log operation", async () => {
    userRepo.findAllUsersEmail.mockResolvedValue([]);

    await useCase.execute();

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should use tracer for span", async () => {
    userRepo.findAllUsersEmail.mockResolvedValue([]);

    await useCase.execute();

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    userRepo.findAllUsersEmail.mockRejectedValue(new Error("Database error"));

    await expect(useCase.execute()).rejects.toThrow("Database error");
  });

  it("should preserve email format", async () => {
    const mockEmails = [
      "test.user@example.com",
      "test+alias@example.co.uk",
      "user_name@sub.example.com",
    ];
    userRepo.findAllUsersEmail.mockResolvedValue(mockEmails);

    const result = await useCase.execute();

    expect(result).toEqual(mockEmails);
  });
});
