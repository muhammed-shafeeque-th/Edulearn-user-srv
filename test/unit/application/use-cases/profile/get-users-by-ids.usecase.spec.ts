import GetUsersByIdsUseCase from "@/application/use-cases/profile/impls/get-users-by-ids.usecase";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { createMockUser } from "test/fixtures";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("GetUsersByIdsUseCase", () => {
  let useCase: GetUsersByIdsUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetUsersByIdsUseCase(userRepo, logger as any, tracer as any);
  });

  it("should return users by their IDs", async () => {
    const mockUsers = [
      createMockUser({ id: "user-1" }),
      createMockUser({ id: "user-2" }),
    ];
    userRepo.findUsersByIds.mockResolvedValue(mockUsers);

    const result = await useCase.execute({
      userIds: ["user-1", "user-2"],
    } as any);

    expect(result.users).toHaveLength(2);
    expect(result.users[0].id).toBe("user-1");
    expect(result.users[1].id).toBe("user-2");
    expect(userRepo.findUsersByIds).toHaveBeenCalledWith(["user-1", "user-2"]);
  });

  it("should return empty array when no user IDs provided", async () => {
    userRepo.findUsersByIds.mockResolvedValue([]);

    const result = await useCase.execute({ userIds: [] } as any);

    expect(result.users).toHaveLength(0);
    expect(userRepo.findUsersByIds).toHaveBeenCalledWith([]);
  });

  it("should return partial results when some users not found", async () => {
    const mockUsers = [createMockUser({ id: "user-1" })];
    userRepo.findUsersByIds.mockResolvedValue(mockUsers);

    const result = await useCase.execute({
      userIds: ["user-1", "user-not-exists"],
    } as any);

    expect(result.users).toHaveLength(1);
    expect(result.users[0].id).toBe("user-1");
  });

  it("should handle single user ID", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    userRepo.findUsersByIds.mockResolvedValue([mockUser]);

    const result = await useCase.execute({ userIds: ["user-123"] } as any);

    expect(result.users).toHaveLength(1);
    expect(result.users[0].id).toBe("user-123");
  });

  it("should map domain users to DTOs", async () => {
    const mockUsers = [
      createMockUser({
        id: "user-1",
        email: "user1@example.com",
        firstName: "John",
      }),
    ];
    userRepo.findUsersByIds.mockResolvedValue(mockUsers);

    const result = await useCase.execute({ userIds: ["user-1"] } as any);

    expect(result.users[0].email).toBe("user1@example.com");
    expect(result.users[0].firstName).toBe("John");
  });

  it("should handle repository errors gracefully", async () => {
    userRepo.findUsersByIds.mockRejectedValue(new Error("Database error"));

    await expect(
      useCase.execute({ userIds: ["user-1"] } as any),
    ).rejects.toThrow("Database error");
  });

  it("should handle many user IDs", async () => {
    const userIds = Array.from({ length: 100 }, (_, i) => `user-${i}`);
    const mockUsers = userIds.map((id) => createMockUser({ id }));
    userRepo.findUsersByIds.mockResolvedValue(mockUsers);

    const result = await useCase.execute({ userIds } as any);

    expect(result.users).toHaveLength(100);
    expect(userRepo.findUsersByIds).toHaveBeenCalledWith(userIds);
  });
});
