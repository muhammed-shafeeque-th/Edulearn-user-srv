import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import { IInstructorStudentRepository } from "src/domain/repositories/instructor-student.repository";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ListStudentsOfInstructorRequest } from "src/infrastructure/grpc/generated/user/types/instructor_student";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export default class ListStudentsOfInstructorUseCase {
  public constructor(
    private readonly instructorStudentRepository: IInstructorStudentRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  /**
   * Lists the instructors of a student.
   * @param dto - The request DTO containing instructorId and pagination info.
   */
  async execute(
    dto: ListStudentsOfInstructorRequest,
  ): Promise<{ students: UserDto[]; total: number }> {
    return this.tracer.startActiveSpan(
      "ListStudentsOfInstructorUseCase.execute",
      async (span) => {
        try {
          const { pagination, instructorId } = dto;
          this.logger.info("Executing ListStudentsOfInstructorUseCase", {
            instructorId: dto.instructorId,
            page: dto.pagination?.page,
            pageSize: dto.pagination?.pageSize,
          });

          const page = pagination?.page ?? 1;
          let pageSize = pagination?.pageSize ?? 20;
          pageSize = Math.min(Math.max(pageSize, 1), 100);

          const offset = (page - 1) * pageSize;
          const limit = pageSize;

          const { data, total } =
            await this.instructorStudentRepository.getStudentsOfInstructor({
              instructorId,
              pagination: { offset, limit },
            });

          const studentIds = data.map((item) => item.studentId);
          if (studentIds.length === 0) {
            return {
              students: [],
              total: 0,
            };
          }

          const instructors =
            await this.userRepository.findUsersByIds(studentIds);

          this.logger.info("ListStudentsOfInstructorUseCase succeeded.", {
            instructorId,
            totalInstructors: total,
          });

          return {
            students: instructors.map(UserDto.fromDomain),
            total,
          };
        } catch (error) {
          this.logger.error(
            "Error in ListStudentsOfInstructorUseCase: " +
              (error?.message || error),
            error,
          );
          throw error;
        }
      },
    );
  }
}
