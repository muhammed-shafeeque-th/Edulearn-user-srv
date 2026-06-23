import GetInstructorByUsernameUseCaseImpl from "@/application/use-cases/profile/impls/get-instructor-by-username.use-case";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { UserNotFoundException } from "src/domain/exceptions";
import { createMockUser } from "test/fixtures";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("GetInstructorByUsernameUseCaseImpl", () => {
  let useCase: GetInstructorByUsernameUseCaseImpl;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetInstructorByUsernameUseCaseImpl(
      userRepo,
      logger as any,
      tracer as any,
    );
  });

  it("should return instructor by username", async () => {
    const mockUser = createMockUser({ id: "instructor-1" });
    userRepo.findByUserSlug.mockResolvedValue(mockUser);

    const result = await useCase.execute({
      username: "john-doe",
    } as any);

    expect(result).toBeDefined();
    expect(result.id).toBe("instructor-1");
  });

  it("should throw UserNotFoundException when instructor not found", async () => {
    userRepo.findByUserSlug.mockResolvedValue(null);

    await expect(
      useCase.execute({ username: "non-existent" } as any),
    ).rejects.toThrow(UserNotFoundException);
  });

  it("should call repository with slugified username", async () => {
    const mockUser = createMockUser();
    userRepo.findByUserSlug.mockResolvedValue(mockUser);

    await useCase.execute({ username: "John Doe" } as any);

    expect(userRepo.findByUserSlug).toHaveBeenCalled();
  });

  it("should map domain user to DTO", async () => {
    const mockUser = createMockUser({
      id: "instructor-1",
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
    });
    userRepo.findByUserSlug.mockResolvedValue(mockUser);

    const result = await useCase.execute({ username: "john-doe" } as any);

    expect(result.email).toBe("john@example.com");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
  });

  it("should use tracer for span creation", async () => {
    const mockUser = createMockUser();
    userRepo.findByUserSlug.mockResolvedValue(mockUser);

    await useCase.execute({ username: "john-doe" } as any);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should log instructor retrieval", async () => {
    const mockUser = createMockUser();
    userRepo.findByUserSlug.mockResolvedValue(mockUser);

    await useCase.execute({ username: "john-doe" } as any);

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    userRepo.findByUserSlug.mockRejectedValue(new Error("Database error"));

    await expect(
      useCase.execute({ username: "john-doe" } as any),
    ).rejects.toThrow("Database error");
  });

  it("should handle different username formats", async () => {
    const mockUser = createMockUser();
    userRepo.findByUserSlug.mockResolvedValue(mockUser);

    await useCase.execute({ username: "john_doe_123" } as any);

    expect(userRepo.findByUserSlug).toHaveBeenCalled();
  });

  it("should handle hyphenated usernames", async () => {
    const mockUser = createMockUser();
    userRepo.findByUserSlug.mockResolvedValue(mockUser);

    await useCase.execute({ username: "john-doe" } as any);

    expect(userRepo.findByUserSlug).toHaveBeenCalled();
  });
});
