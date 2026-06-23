import BlockInstructorRoleUseCaseImpl from "@/application/use-cases/profile/impls/block-instructor.use-case";
import { ICartRepository } from "@/domain/repositories/cart.repository";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { UserRoles } from "src/domain/entities/user-entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";
import { createMockUser } from "test/fixtures";
import { createMockEventPublisher } from "test/mocks/event-publisher.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("BlockInstructorRoleUseCaseImpl", () => {
  let useCase: BlockInstructorRoleUseCaseImpl;
  let userRepo: jest.Mocked<IUserRepository>;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    eventPublisher = createMockEventPublisher();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new BlockInstructorRoleUseCaseImpl(
      userRepo,
      eventPublisher,
      logger,
      tracer,
    );
  });

  it("should block instructor role and publish Kafka event", async () => {
    const mockUser = createMockUser({
      id: "instructor-1",
      roles: [UserRoles.INSTRUCTOR],
    });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute({ instructorId: "instructor-1" });

    expect(result).toBeDefined();
    expect(userRepo.update).toHaveBeenCalledWith("instructor-1", mockUser);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it("should return user without change if already blocked", async () => {
    const mockUser = createMockUser({
      id: "instructor-1",
      roles: [UserRoles.INSTRUCTOR],
    });
    mockUser.blockRole(UserRoles.INSTRUCTOR);
    userRepo.findById.mockResolvedValue(mockUser);

    const result = await useCase.execute({ instructorId: "instructor-1" });

    expect(result).toBeDefined();
    expect(userRepo.update).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it("should throw UserNotFoundException if user not found", async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ instructorId: "non-existent" }),
    ).rejects.toThrow(UserNotFoundException);
  });

  it("should throw BadRequestException if user is not an instructor", async () => {
    const mockUser = createMockUser({
      id: "user-1",
      roles: [UserRoles.STUDENT],
    });
    userRepo.findById.mockResolvedValue(mockUser);

    await expect(useCase.execute({ instructorId: "user-1" })).rejects.toThrow(
      BadRequestException,
    );
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it("should use tracer for span creation", async () => {
    const mockUser = createMockUser({
      id: "instructor-1",
      roles: [UserRoles.INSTRUCTOR],
    });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    await useCase.execute({ instructorId: "instructor-1" });

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should log blocking operation", async () => {
    const mockUser = createMockUser({
      id: "instructor-1",
      roles: [UserRoles.INSTRUCTOR],
    });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    await useCase.execute({ instructorId: "instructor-1" });

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should publish event with correct topic", async () => {
    const mockUser = createMockUser({
      id: "instructor-1",
      roles: [UserRoles.INSTRUCTOR],
    });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    await useCase.execute({ instructorId: "instructor-1" });

    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        key: "instructor-1",
      }),
    );
  });
});
