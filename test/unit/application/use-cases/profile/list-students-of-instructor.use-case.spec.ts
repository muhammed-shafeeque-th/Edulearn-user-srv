import ListStudentsOfInstructorUseCase from "@/application/use-cases/profile/impls/list-students-of-instructor.use-case";
import { IInstructorStudentRepository } from "@/domain/repositories/instructor-student.repository";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { createMockUser } from "test/fixtures";
import { createMockInstructorStudentRepository } from "test/mocks/instructor-student-repository.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("ListStudentsOfInstructorUseCase", () => {
  let useCase: ListStudentsOfInstructorUseCase;
  let instructorStudentRepo: jest.Mocked<IInstructorStudentRepository>;
  let userRepo: jest.Mocked<IUserRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    instructorStudentRepo = createMockInstructorStudentRepository();
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new ListStudentsOfInstructorUseCase(
      instructorStudentRepo,
      userRepo,
      logger as any,
      tracer as any,
    );
  });

  it("should return list of students for instructor", async () => {
    const instructorStudentData = [
      { studentId: "student-1", instructorId: "instructor-1" },
      { studentId: "student-2", instructorId: "instructor-1" },
    ];
    const mockStudents = [
      createMockUser({ id: "student-1" }),
      createMockUser({ id: "student-2" }),
    ];

    instructorStudentRepo.getStudentsOfInstructor.mockResolvedValue({
      data: instructorStudentData as any,
      total: 2,
    });
    userRepo.findUsersByIds.mockResolvedValue(mockStudents);

    const result = await useCase.execute({
      instructorId: "instructor-1",
      pagination: {},
    } as any);

    expect(result.students).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("should return empty when instructor has no students", async () => {
    instructorStudentRepo.getStudentsOfInstructor.mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await useCase.execute({
      instructorId: "instructor-1",
      pagination: {},
    } as any);

    expect(result.students).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(userRepo.findUsersByIds).not.toHaveBeenCalled();
  });

  it("should apply default pagination", async () => {
    const instructorStudentData = [
      { studentId: "student-1", instructorId: "instructor-1" },
    ];
    const mockStudents = [createMockUser({ id: "student-1" })];

    instructorStudentRepo.getStudentsOfInstructor.mockResolvedValue({
      data: instructorStudentData as any,
      total: 1,
    });
    userRepo.findUsersByIds.mockResolvedValue(mockStudents);

    await useCase.execute({
      instructorId: "instructor-1",
      pagination: {},
    } as any);

    expect(instructorStudentRepo.getStudentsOfInstructor).toHaveBeenCalledWith({
      instructorId: "instructor-1",
      pagination: { offset: 0, limit: 20 },
    });
  });

  it("should apply custom pagination", async () => {
    instructorStudentRepo.getStudentsOfInstructor.mockResolvedValue({
      data: [],
      total: 0,
    });

    await useCase.execute({
      instructorId: "instructor-1",
      pagination: { page: 2, pageSize: 50 },
    } as any);

    expect(instructorStudentRepo.getStudentsOfInstructor).toHaveBeenCalledWith({
      instructorId: "instructor-1",
      pagination: { offset: 50, limit: 50 },
    });
  });

  it("should enforce maximum page size", async () => {
    instructorStudentRepo.getStudentsOfInstructor.mockResolvedValue({
      data: [],
      total: 0,
    });

    await useCase.execute({
      instructorId: "instructor-1",
      pagination: { pageSize: 500 },
    } as any);

    expect(instructorStudentRepo.getStudentsOfInstructor).toHaveBeenCalledWith({
      instructorId: "instructor-1",
      pagination: { offset: 0, limit: 100 },
    });
  });

  it("should map student IDs to UserDTOs", async () => {
    const instructorStudentData = [
      { studentId: "student-1", instructorId: "instructor-1" },
    ];
    const mockStudents = [
      createMockUser({
        id: "student-1",
        email: "student@example.com",
        firstName: "John",
      }),
    ];

    instructorStudentRepo.getStudentsOfInstructor.mockResolvedValue({
      data: instructorStudentData as any,
      total: 1,
    });
    userRepo.findUsersByIds.mockResolvedValue(mockStudents);

    const result = await useCase.execute({
      instructorId: "instructor-1",
      pagination: {},
    } as any);

    expect(result.students[0].email).toBe("student@example.com");
    expect(result.students[0].firstName).toBe("John");
  });

  it("should log operation", async () => {
    instructorStudentRepo.getStudentsOfInstructor.mockResolvedValue({
      data: [],
      total: 0,
    });

    await useCase.execute({
      instructorId: "instructor-1",
      pagination: {},
    } as any);

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should use tracer for span", async () => {
    instructorStudentRepo.getStudentsOfInstructor.mockResolvedValue({
      data: [],
      total: 0,
    });

    await useCase.execute({
      instructorId: "instructor-1",
      pagination: {},
    } as any);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    instructorStudentRepo.getStudentsOfInstructor.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(
      useCase.execute({
        instructorId: "instructor-1",
        pagination: {},
      } as any),
    ).rejects.toThrow("Database error");
    expect(logger.error).toHaveBeenCalled();
  });
});
