import GetUserUseCaseImpl from "@/application/use-cases/profile/impls/get-user.use-case";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { UserNotFoundException } from "src/domain/exceptions";
import { createMockUser, FAKE_EMAIL, FAKE_USER_ID } from "test/fixtures";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("GetUserUseCaseImpl", () => {
  let useCase: GetUserUseCaseImpl;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetUserUseCaseImpl(userRepo, logger as any, tracer as any);
  });

  it("should return user data when found", async () => {
    const mockUser = createMockUser({id: FAKE_USER_ID});
    userRepo.findById.mockResolvedValue(mockUser);

    const result = await useCase.execute({ userId: FAKE_USER_ID });

    expect(result).toBeDefined();
    expect(result.id).toBe(FAKE_USER_ID);
    expect(result.email).toBe(FAKE_EMAIL);
    expect(userRepo.findById).toHaveBeenCalledWith(FAKE_USER_ID);
  });

  it("should throw UserNotFoundException if user is not found", async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: "non-existent" })).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
