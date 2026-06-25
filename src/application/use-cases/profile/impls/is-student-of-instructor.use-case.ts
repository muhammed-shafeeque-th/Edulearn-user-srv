import { Injectable } from "@nestjs/common";
import { IInstructorStudentRepository } from "src/domain/repositories/instructor-student.repository";
import { IsStudentOfInstructorRequest } from "src/infrastructure/grpc/generated/user/types/instructor_student";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IIsStudentOfInstructorUseCase } from "../interfaces/is-student-of-instructor.interface";

@Injectable()
export default class IsStudentOfInstructorUseCase
  implements IIsStudentOfInstructorUseCase
{
  constructor(
    private readonly _instructorStudentRepository: IInstructorStudentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    dto: IsStudentOfInstructorRequest,
  ): Promise<{ isStudent: boolean }> {
    return this._tracer.startActiveSpan(
      "IsStudentOfInstructorUseCase.execute",
      async (span) => {
        try {
          const { studentId, instructorId } = dto;
          this._logger.debug("Executing IsStudentOfInstructorUseCase", {
            studentId,
            instructorId,
          });

          const isStudent =
            await this._instructorStudentRepository.isStudentOfInstructor({
              instructorId,
              studentId,
            });

          this._logger.debug("IsStudentOfInstructorUseCase succeeded.", {
            studentId,
            instructorId,
            isStudent,
          });

          return { isStudent };
        } catch (error: any) {
          this._logger.error(
            "Error in IsStudentOfInstructorUseCase: " +
              (error?.message || error),
            error,
          );
          throw error;
        }
      },
    );
  }
}
