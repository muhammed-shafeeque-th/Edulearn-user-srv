import GetInstructorsUseCaseImpl from "@/application/use-cases/profile/impls/get-instructors.use-case";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { UserRoles } from "src/domain/entities/user-entity";
import { createMockUser } from "test/fixtures";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("GetInstructorsUseCaseImpl", () => {
  let useCase: GetInstructorsUseCaseImpl;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetInstructorsUseCaseImpl(
      userRepo,
      logger as any,
      tracer as any,
    );
  });

  it("should return paginated instructors with default pagination", async () => {
    const mockInstructors = [
      createMockUser({ id: "instructor-1", roles: [UserRoles.INSTRUCTOR] }),
      createMockUser({ id: "instructor-2", roles: [UserRoles.INSTRUCTOR] }),
    ];
    userRepo.findInstructors.mockResolvedValue({
      instructors: mockInstructors,
      totalInstructors: 2,
    });

    const result = await useCase.execute({ pagination: {} } as any);

    expect(result.instructors).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(userRepo.findInstructors).toHaveBeenCalled();
  });

  it("should apply pagination with correct offset and limit", async () => {
    const mockInstructors = [createMockUser({ roles: [UserRoles.INSTRUCTOR] })];
    userRepo.findInstructors.mockResolvedValue({
      instructors: mockInstructors,
      totalInstructors: 100,
    });

    await useCase.execute({
      pagination: { page: 3, pageSize: 25 },
    } as any);

    expect(userRepo.findInstructors).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 50,
        limit: 25,
      }),
    );
  });

  it("should enforce maximum page size of 1000", async () => {
    const mockInstructors = [createMockUser({ roles: [UserRoles.INSTRUCTOR] })];
    userRepo.findInstructors.mockResolvedValue({
      instructors: mockInstructors,
      totalInstructors: 1000,
    });

    await useCase.execute({
      pagination: { pageSize: 5000 },
    } as any);

    expect(userRepo.findInstructors).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 1000,
      }),
    );
  });

  it("should apply status filter when provided", async () => {
    userRepo.findInstructors.mockResolvedValue({
      instructors: [],
      totalInstructors: 0,
    });

    await useCase.execute({
      filter: { status: 1 }, // ACTIVE
    } as any);

    expect(userRepo.findInstructors).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
      }),
    );
  });

  it("should apply email filter when provided", async () => {
    userRepo.findInstructors.mockResolvedValue({
      instructors: [],
      totalInstructors: 0,
    });

    await useCase.execute({
      filter: { email: "instructor@example.com" },
    } as any);

    expect(userRepo.findInstructors).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "instructor@example.com",
      }),
    );
  });

  it("should apply search filter when provided", async () => {
    userRepo.findInstructors.mockResolvedValue({
      instructors: [],
      totalInstructors: 0,
    });

    await useCase.execute({
      filter: { search: "python" },
    } as any);

    expect(userRepo.findInstructors).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "python",
      }),
    );
  });

  it("should apply sort field and order", async () => {
    userRepo.findInstructors.mockResolvedValue({
      instructors: [],
      totalInstructors: 0,
    });

    await useCase.execute({
      sort: { field: "email", order: 0 }, // 0 = DESC
    } as any);

    expect(userRepo.findInstructors).toHaveBeenCalledWith(
      expect.objectContaining({
        sortField: "email",
      }),
    );
  });

  it("should return empty instructors list when none found", async () => {
    userRepo.findInstructors.mockResolvedValue({
      instructors: [],
      totalInstructors: 0,
    });

    const result = await useCase.execute({ pagination: {} } as any);

    expect(result.instructors).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("should map domain instructors to DTOs", async () => {
    const mockInstructors = [
      createMockUser({
        id: "instructor-1",
        email: "instructor1@example.com",
        firstName: "John",
        roles: [UserRoles.INSTRUCTOR],
      }),
    ];
    userRepo.findInstructors.mockResolvedValue({
      instructors: mockInstructors,
      totalInstructors: 1,
    });

    const result = await useCase.execute({ pagination: {} } as any);

    expect(result.instructors[0].email).toBe("instructor1@example.com");
    expect(result.instructors[0].firstName).toBe("John");
  });

  it("should use tracer for span creation", async () => {
    userRepo.findInstructors.mockResolvedValue({
      instructors: [],
      totalInstructors: 0,
    });

    await useCase.execute({ pagination: {} } as any);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should log operation", async () => {
    userRepo.findInstructors.mockResolvedValue({
      instructors: [],
      totalInstructors: 0,
    });

    await useCase.execute({ pagination: {} } as any);

    expect(logger.debug).toHaveBeenCalled();
  });
});
