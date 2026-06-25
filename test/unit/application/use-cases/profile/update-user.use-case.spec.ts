import UpdateUserUseCaseImpl from "@/application/use-cases/profile/impls/update-user.use-case";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { UserNotFoundException } from "src/domain/exceptions";
import { createMockUser } from "test/fixtures";
import { createMockEventPublisher } from "test/mocks/event-publisher.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("UpdateUserUseCaseImpl", () => {
  let useCase: UpdateUserUseCaseImpl;
  let userRepo: jest.Mocked<IUserRepository>;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    eventPublisher = createMockEventPublisher();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new UpdateUserUseCaseImpl(
      userRepo,
      eventPublisher as any,
      logger as any,
      tracer as any,
    );
  });

  it("should update basic user data", async () => {
    const mockUser = createMockUser();
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute({
      userId: "user-123",
      firstName: "Updated",
      lastName: "Name",
    } as any);

    expect(result).toBeDefined();
    expect(userRepo.update).toHaveBeenCalledWith("user-123", mockUser);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it("should create a new profile if one does not exist", async () => {
    const mockUser = createMockUser();
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute({
      userId: "user-123",
      profile: {
        bio: "A new bio",
        phone: "+15555555555",
        country: "US",
      },
    } as any);

    expect(result).toBeDefined();
    expect(userRepo.update).toHaveBeenCalled();
  });

  it("should update existing profile fields", async () => {
    const mockUser = createMockUser();
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute({
      userId: "user-123",
      profile: {
        bio: "Updated bio",
      },
    } as any);

    expect(result).toBeDefined();
  });

  it("should update social links", async () => {
    const mockUser = createMockUser();
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute({
      userId: "user-123",
      socials: [{ provider: "github", profileUrl: "https://github.com/test" }],
    } as any);

    expect(result).toBeDefined();
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it("should throw UserNotFoundException if user not found", async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: "non-existent" } as any),
    ).rejects.toThrow(UserNotFoundException);
  });
});
