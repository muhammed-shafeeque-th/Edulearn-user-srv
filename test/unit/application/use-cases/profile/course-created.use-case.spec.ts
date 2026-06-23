import CourseCreatedUseCase from "@/application/use-cases/profile/impls/course-created.use-case";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { UserNotFoundException } from "src/domain/exceptions";
import { createMockInstructorUser } from "test/fixtures";
import { buildCourseCreatedEvent } from "test/fixtures/event-dto.fixture";
import { createMockEventPublisher } from "test/mocks/event-publisher.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";

describe("CourseCreatedUseCase", () => {
  let useCase: CourseCreatedUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new CourseCreatedUseCase(userRepo, logger, tracer);
  });

  it("should increment instructor total courses", async () => {
    const mockUser = createMockInstructorUser({ id: "instructor-1" });
    const initialCourseCount = mockUser.instructorProfile?.totalCourses ?? 0;
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const event = buildCourseCreatedEvent({
      instructorId: "instructor-1",
      courseId: "course-1",
    });

    const result = await useCase.execute(event);

    expect(result).toBeDefined();
    expect(userRepo.findById).toHaveBeenCalledWith("instructor-1");
    expect(userRepo.update).toHaveBeenCalledWith("instructor-1", mockUser);
  });

  it("should throw UserNotFoundException if instructor not found", async () => {
    userRepo.findById.mockResolvedValue(null);

    const event = buildCourseCreatedEvent({ instructorId: "non-existent" });

    await expect(useCase.execute(event)).rejects.toThrow(UserNotFoundException);
  });

  it("should return updated user", async () => {
    const mockUser = createMockInstructorUser({ id: "instructor-1" });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const event = buildCourseCreatedEvent({
      instructorId: "instructor-1",
      courseId: "course-1",
    });

    const result = await useCase.execute(event);

    expect(result).toBe(mockUser);
  });

  it("should use tracer for span creation", async () => {
    const mockUser = createMockInstructorUser({ id: "instructor-1" });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const event = buildCourseCreatedEvent({ instructorId: "instructor-1" });

    await useCase.execute(event);

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should log course creation event", async () => {
    const mockUser = createMockInstructorUser({ id: "instructor-1" });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const event = buildCourseCreatedEvent({ instructorId: "instructor-1" });

    await useCase.execute(event);

    expect(logger.debug).toHaveBeenCalled();
  });

  it("should handle repository errors on findById", async () => {
    userRepo.findById.mockRejectedValue(new Error("Database error"));

    const event = buildCourseCreatedEvent({ instructorId: "instructor-1" });

    await expect(useCase.execute(event)).rejects.toThrow("Database error");
  });

  it("should handle repository errors on update", async () => {
    const mockUser = createMockInstructorUser({ id: "instructor-1" });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockRejectedValue(new Error("Update failed"));

    const event = buildCourseCreatedEvent({ instructorId: "instructor-1" });

    await expect(useCase.execute(event)).rejects.toThrow("Update failed");
  });

  it("should process multiple course creation events", async () => {
    const mockUser = createMockInstructorUser({ id: "instructor-1" });
    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.update.mockResolvedValue(mockUser);

    const events = [
      buildCourseCreatedEvent({
        instructorId: "instructor-1",
        courseId: "course-1",
      }),
      buildCourseCreatedEvent({
        instructorId: "instructor-1",
        courseId: "course-2",
      }),
    ];

    for (const event of events) {
      await useCase.execute(event);
    }

    expect(userRepo.update).toHaveBeenCalledTimes(2);
  });
});
