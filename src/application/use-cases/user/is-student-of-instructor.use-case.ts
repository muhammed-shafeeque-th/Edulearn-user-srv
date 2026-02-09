import { Injectable } from "@nestjs/common";
import { IInstructorStudentRepository } from "src/domain/repositories/instructor-student.repository";
import { IsStudentOfInstructorRequest } from "src/infrastructure/grpc/generated/user/types/instructor_student";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";


@Injectable()
export default class IsStudentOfInstructorUseCase {
  constructor(
    private readonly instructorStudentRepository: IInstructorStudentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  /**
   * Checks if the studentId is a student of the instructorId.
   * @param dto - The DTO containing studentId and instructorId.
   * @returns An object indicating if the user is a student.
   */
  async execute(
    dto: IsStudentOfInstructorRequest
  ): Promise<{ isStudent: boolean }> {
    return this.tracer.startActiveSpan(
      "IsStudentOfInstructorUseCase.execute",
      async (span) => {
        try {
          const { studentId, instructorId } = dto;
          this.logger.info("Executing IsStudentOfInstructorUseCase", {
            studentId,
            instructorId,
          });

          const isStudent = await this.instructorStudentRepository.isStudentOfInstructor({
            instructorId,
            studentId,
          });

          this.logger.info("IsStudentOfInstructorUseCase succeeded.", {
            studentId,
            instructorId,
            isStudent,
          });

          return { isStudent };
        } catch (error) {
          this.logger.error("Error in IsStudentOfInstructorUseCase: " + (error?.message || error), error);
          throw error;
        } finally {
          span?.end?.();
        }
      }
    );
  }
}
