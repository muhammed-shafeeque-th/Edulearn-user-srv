import BlockUserAccountUseCaseImpl from "@/application/use-cases/profile/impls/block-user-account.use-case";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { UserStatus } from "src/domain/entities/user-entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { createMockUser } from "test/fixtures";
import { createMockEventPublisher } from "test/mocks/event-publisher.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("BlockUserUseCaseImpl", () => {
  let useCase: BlockUserAccountUseCaseImpl;
  let userRepo: jest.Mocked<IUserRepository>;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    eventPublisher = createMockEventPublisher();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new BlockUserAccountUseCaseImpl(
      userRepo,
      eventPublisher,
      logger,
      tracer,
    );
  });

  it("should block a user and publish a Kafka event", async () => {
    const mockUser = createMockUser({ status: UserStatus.ACTIVE });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute({ userId: "user-123" });

    expect(result.status).toBe(UserStatus.BLOCKED);
    expect(userRepo.update).toHaveBeenCalledWith("user-123", mockUser);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it("should return the user without modification if already blocked", async () => {
    const mockUser = createMockUser({ status: UserStatus.BLOCKED });
    userRepo.findById.mockResolvedValue(mockUser);

    const result = await useCase.execute({ userId: "user-123" });

    expect(result.status).toBe(UserStatus.BLOCKED);
    expect(userRepo.update).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it("should throw UserNotFoundException if user does not exist", async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: "non-existent" })).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
