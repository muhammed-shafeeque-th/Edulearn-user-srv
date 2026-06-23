import ListInstructorsOfStudentUseCase from "@/application/use-cases/profile/impls/list-instructors-of-student.use-case";
import { IInstructorStudentRepository } from "@/domain/repositories/instructor-student.repository";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { createMockUser } from "test/fixtures";
import { createMockInstructorStudentRepository } from "test/mocks/instructor-student-repository.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("ListInstructorsOfStudentUseCase", () => {
  let useCase: ListInstructorsOfStudentUseCase;
  let instructorStudentRepo: jest.Mocked<IInstructorStudentRepository>;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    instructorStudentRepo = createMockInstructorStudentRepository();
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new ListInstructorsOfStudentUseCase(
      instructorStudentRepo,
      userRepo,
      logger as any,
      tracer as any,
    );
  });

  it("should return list of instructors for student", async () => {
    const instructorStudentData = [
      { instructorId: "instructor-1", studentId: "student-1" },
      { instructorId: "instructor-2", studentId: "student-1" },
    ];
    const mockInstructors = [
      createMockUser({ id: "instructor-1" }),
      createMockUser({ id: "instructor-2" }),
    ];

    instructorStudentRepo.getInstructorsOfStudent.mockResolvedValue({
      data: instructorStudentData as any,
      total: 2,
    });
    userRepo.findUsersByIds.mockResolvedValue(mockInstructors);

    const result = await useCase.execute({
      studentId: "student-1",
      pagination: {},
    } as any);

    expect(result.instructors).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("should return empty when student has no instructors", async () => {
    instructorStudentRepo.getInstructorsOfStudent.mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await useCase.execute({
      studentId: "student-1",
      pagination: {},
    } as any);

    expect(result.instructors).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(userRepo.findUsersByIds).not.toHaveBeenCalled();
  });

  it("should apply default pagination", async () => {
    const instructorStudentData = [
      { instructorId: "instructor-1", studentId: "student-1" },
    ];
    const mockInstructors = [createMockUser({ id: "instructor-1" })];

    instructorStudentRepo.getInstructorsOfStudent.mockResolvedValue({
      data: instructorStudentData as any,
      total: 1,
    });
    userRepo.findUsersByIds.mockResolvedValue(mockInstructors);

    await useCase.execute({
      studentId: "student-1",
      pagination: {},
    } as any);

    expect(instructorStudentRepo.getInstructorsOfStudent).toHaveBeenCalledWith({
      studentId: "student-1",
      pagination: { offset: 0, limit: 20 },
    });
  });

  it("should apply custom pagination", async () => {
    instructorStudentRepo.getInstructorsOfStudent.mockResolvedValue({
      data: [],
      total: 0,
    });

    await useCase.execute({
      studentId: "student-1",
      pagination: { page: 3, pageSize: 25 },
    } as any);

    expect(instructorStudentRepo.getInstructorsOfStudent).toHaveBeenCalledWith({
      studentId: "student-1",
      pagination: { offset: 50, limit: 25 },
    });
  });

  it("should enforce maximum page size", async () => {
    instructorStudentRepo.getInstructorsOfStudent.mockResolvedValue({
      data: [],
      total: 0,
    });

    await useCase.execute({
      studentId: "student-1",
      pagination: { pageSize: 500 },
    } as any);

    expect(instructorStudentRepo.getInstructorsOfStudent).toHaveBeenCalledWith({
      studentId: "student-1",
      pagination: { offset: 0, limit: 100 },
    });
  });

  it("should map instructor IDs to UserDTOs", async () => {
    const instructorStudentData = [
      { instructorId: "instructor-1", studentId: "student-1" },
    ];
    const mockInstructors = [
      createMockUser({
        id: "instructor-1",
        email: "instructor@example.com",
        firstName: "Jane",
      }),
    ];

    instructorStudentRepo.getInstructorsOfStudent.mockResolvedValue({
      data: instructorStudentData as any,
      total: 1,
    });
    userRepo.findUsersByIds.mockResolvedValue(mockInstructors);

    const result = await useCase.execute({
      studentId: "student-1",
      pagination: {},
    } as any);

    expect(result.instructors[0].email).toBe("instructor@example.com");
    expect(result.instructors[0].firstName).toBe("Jane");
  });

  it("should log operation", async () => {
    instructorStudentRepo.getInstructorsOfStudent.mockResolvedValue({
      data: [],
      total: 0,
    });

    await useCase.execute({
      studentId: "student-1",
      pagination: {},
    } as any);

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should use tracer for span", async () => {
    instructorStudentRepo.getInstructorsOfStudent.mockResolvedValue({
      data: [],
      total: 0,
    });

    await useCase.execute({
      studentId: "student-1",
      pagination: {},
    } as any);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    instructorStudentRepo.getInstructorsOfStudent.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(
      useCase.execute({
        studentId: "student-1",
        pagination: {},
      } as any),
    ).rejects.toThrow("Database error");
    expect(logger.error).toHaveBeenCalled();
  });
});
