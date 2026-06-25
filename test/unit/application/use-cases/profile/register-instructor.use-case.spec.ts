import RegisterInstructorUseCase from "@/application/use-cases/profile/impls/register-instructor.usecase";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { UserRoles } from "src/domain/entities/user-entity";
import {
  UserNotFoundException,
  UserAlreadyExistException,
} from "src/domain/exceptions";
import { createMockUser } from "test/fixtures";
import { createMockEventPublisher } from "test/mocks/event-publisher.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import {
  createMockUserRepository,
  MockUserRepository,
} from "test/mocks/user-repository.mock";

describe("RegisterInstructorUseCaseImpl", () => {
  let useCase: RegisterInstructorUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    eventPublisher = createMockEventPublisher();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new RegisterInstructorUseCase(
      userRepo,
      eventPublisher as any,
      logger as any,
      tracer as any,
    );
  });

  it("should promote a user to instructor role", async () => {
    const mockUser = createMockUser({ roles: [UserRoles.STUDENT] });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.findByUserSlug.mockResolvedValue(null);
    userRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute({
      userId: "user-123",
      username: "prof-test",
      bio: "Expert instructor",
    } as any);

    expect(result).toBeDefined();
    expect(userRepo.update).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it("should reject duplicate username/slug", async () => {
    const mockUser = createMockUser({ roles: [UserRoles.STUDENT] });
    const existingInstructor = createMockUser({
      roles: [UserRoles.INSTRUCTOR],
      email: "other@example.com",
    });

    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.findByUserSlug.mockResolvedValue(existingInstructor);

    await expect(
      useCase.execute({
        userId: "user-123",
        username: "existing-slug",
        biography: "Bio",
      } as any),
    ).rejects.toThrow(UserAlreadyExistException);
  });

  it("should throw UserNotFoundException if user not found", async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "non-existent",
        username: "test",
        bio: "Bio",
      } as any),
    ).rejects.toThrow(UserNotFoundException);
  });
});
