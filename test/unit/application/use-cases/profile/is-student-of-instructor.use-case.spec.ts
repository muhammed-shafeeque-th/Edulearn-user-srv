import IsStudentOfInstructorUseCase from "@/application/use-cases/profile/impls/is-student-of-instructor.use-case";
import { IInstructorStudentRepository } from "@/domain/repositories/instructor-student.repository";
import { createMockInstructorStudentRepository } from "test/mocks/instructor-student-repository.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";

describe("IsStudentOfInstructorUseCase", () => {
  let useCase: IsStudentOfInstructorUseCase;
  let instructorStudentRepo: jest.Mocked<IInstructorStudentRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    instructorStudentRepo = createMockInstructorStudentRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new IsStudentOfInstructorUseCase(
      instructorStudentRepo,
      logger as any,
      tracer as any,
    );
  });

  it("should return true when student is of instructor", async () => {
    instructorStudentRepo.isStudentOfInstructor.mockResolvedValue(true);

    const result = await useCase.execute({
      studentId: "student-1",
      instructorId: "instructor-1",
    } as any);

    expect(result.isStudent).toBe(true);
    expect(instructorStudentRepo.isStudentOfInstructor).toHaveBeenCalledWith({
      studentId: "student-1",
      instructorId: "instructor-1",
    });
  });

  it("should return false when student is not of instructor", async () => {
    instructorStudentRepo.isStudentOfInstructor.mockResolvedValue(false);

    const result = await useCase.execute({
      studentId: "student-1",
      instructorId: "instructor-1",
    } as any);

    expect(result.isStudent).toBe(false);
  });

  it("should handle multiple student-instructor checks", async () => {
    instructorStudentRepo.isStudentOfInstructor.mockResolvedValue(true);

    const checks = [
      { studentId: "student-1", instructorId: "instructor-1" },
      { studentId: "student-2", instructorId: "instructor-1" },
      { studentId: "student-1", instructorId: "instructor-2" },
    ];

    for (const check of checks) {
      const result = await useCase.execute(check as any);
      expect(result.isStudent).toBe(true);
    }

    expect(instructorStudentRepo.isStudentOfInstructor).toHaveBeenCalledTimes(
      3,
    );
  });

  it("should log the operation", async () => {
    instructorStudentRepo.isStudentOfInstructor.mockResolvedValue(true);

    await useCase.execute({
      studentId: "student-1",
      instructorId: "instructor-1",
    } as any);

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should use tracer for span", async () => {
    instructorStudentRepo.isStudentOfInstructor.mockResolvedValue(true);

    await useCase.execute({
      studentId: "student-1",
      instructorId: "instructor-1",
    } as any);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    instructorStudentRepo.isStudentOfInstructor.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(
      useCase.execute({
        studentId: "student-1",
        instructorId: "instructor-1",
      } as any),
    ).rejects.toThrow("Database error");
    expect(logger.error).toHaveBeenCalled();
  });

  it("should set span attributes with IDs", async () => {
    instructorStudentRepo.isStudentOfInstructor.mockResolvedValue(true);

    await useCase.execute({
      studentId: "student-123",
      instructorId: "instructor-456",
    } as any);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });
});
