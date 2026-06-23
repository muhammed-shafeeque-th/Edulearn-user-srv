import GetUsersUseCaseImpl from "@/application/use-cases/profile/impls/get-users.usecase";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { UserStatus } from "@/presentation/grpc/dtos/get-users.dto";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";
import { createMockUser } from "test/fixtures";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("GetUsersUseCaseImpl", () => {
  let useCase: GetUsersUseCaseImpl;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetUsersUseCaseImpl(userRepo, logger as any, tracer as any);
  });

  it("should return paginated users with default pagination", async () => {
    const mockUsers = [createMockUser(), createMockUser({ id: "user-456" })];
    userRepo.findUsers.mockResolvedValue({
      users: mockUsers,
      totalUsers: 2,
    });

    const result = await useCase.execute({ pagination: {} } as any);

    expect(result.users).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(userRepo.findUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 0,
        limit: 20,
      }),
    );
  });

  it("should apply pagination filters correctly", async () => {
    const mockUsers = [createMockUser()];
    userRepo.findUsers.mockResolvedValue({
      users: mockUsers,
      totalUsers: 100,
    });

    await useCase.execute({
      pagination: { page: 3, pageSize: 25 },
    } as any);

    expect(userRepo.findUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 50,
        limit: 25,
      }),
    );
  });

  it("should enforce maximum page size of 1000", async () => {
    const mockUsers = [createMockUser()];
    userRepo.findUsers.mockResolvedValue({
      users: mockUsers,
      totalUsers: 1000,
    });

    await useCase.execute({
      pagination: { pageSize: 5000 },
    } as any);

    expect(userRepo.findUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 1000,
      }),
    );
  });

  it("should apply status filter when provided", async () => {
    const mockUsers = [createMockUser()];
    userRepo.findUsers.mockResolvedValue({
      users: mockUsers,
      totalUsers: 1,
    });

    await useCase.execute({
      filter: { status: UserStatus.ACTIVE } ,
      pagination: { page: 1, pageSize: 10 },
    } as any);

    expect(userRepo.findUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
      }),
    );
  });

  it("should apply email filter when provided", async () => {
    const mockUsers = [createMockUser()];
    userRepo.findUsers.mockResolvedValue({
      users: mockUsers,
      totalUsers: 1,
    });

    await useCase.execute({
      filter: { email: "test@example.com" },
    } as any);

    expect(userRepo.findUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
      }),
    );
  });

  it("should apply search filter when provided", async () => {
    const mockUsers = [createMockUser()];
    userRepo.findUsers.mockResolvedValue({
      users: mockUsers,
      totalUsers: 1,
    });

    await useCase.execute({
      filter: { search: "john" },
    } as any);

    expect(userRepo.findUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "john",
      }),
    );
  });

  it("should apply sort field and order when provided", async () => {
    const mockUsers = [createMockUser()];
    userRepo.findUsers.mockResolvedValue({
      users: mockUsers,
      totalUsers: 1,
    });

    await useCase.execute({
      sort: { field: "email", order: "DESC" },
    } as any);

    expect(userRepo.findUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        sortField: "email",
      }),
    );
  });

  it("should throw BadRequestException for invalid sort field", async () => {
    await expect(
      useCase.execute({
        sort: { field: "invalidField", order: "ASC" },
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("should return empty users list when no users found", async () => {
    userRepo.findUsers.mockResolvedValue({
      users: [],
      totalUsers: 0,
    });

    const result = await useCase.execute({ pagination: {} } as any);

    expect(result.users).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("should trim whitespace from email filter", async () => {
    userRepo.findUsers.mockResolvedValue({
      users: [],
      totalUsers: 0,
    });

    await useCase.execute({
      filter: { email: "  test@example.com  " },
    } as any);

    expect(userRepo.findUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
      }),
    );
  });

  it("should ignore empty email filter", async () => {
    userRepo.findUsers.mockResolvedValue({
      users: [],
      totalUsers: 0,
    });

    await useCase.execute({
      filter: { email: "   " },
    } as any);

    expect(userRepo.findUsers).toHaveBeenCalledWith(
      expect.not.objectContaining({
        email: expect.any(String),
      }),
    );
  });
});
