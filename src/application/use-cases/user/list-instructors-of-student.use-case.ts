import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import { IInstructorStudentRepository } from "src/domain/repositories/instructor-student.repository";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ListInstructorsOfStudentRequest } from "src/infrastructure/grpc/generated/user/types/instructor_student";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export default class ListInstructorsOfStudentUseCase {
  public constructor(
    private readonly instructorStudentRepository: IInstructorStudentRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  /**
   * Lists the instructors of a student .
   * @param dto - The request DTO containing studentId and pagination info.
   */
  async execute(
    dto: ListInstructorsOfStudentRequest,
  ): Promise<{ instructors: UserDto[]; total: number }> {
    return this.tracer.startActiveSpan(
      "ListInstructorsOfStudentUseCase.execute",
      async (span) => {
        try {
          this.logger.info("Executing ListInstructorsOfStudentUseCase", {
            studentId: dto.studentId,
            page: dto.pagination?.page,
            pageSize: dto.pagination?.pageSize,
          });

          const { pagination, studentId } = dto;

          const page = pagination?.page ?? 1;
          let pageSize = pagination?.pageSize ?? 20;
          pageSize = Math.min(Math.max(pageSize, 1), 100);

          const offset = (page - 1) * pageSize;
          const limit = pageSize;

          const { data, total } =
            await this.instructorStudentRepository.getInstructorsOfStudent({
              studentId,
              pagination: { offset, limit },
            });

          const instructorIds = data.map((item) => item.instructorId);

          if (instructorIds.length === 0) {
            return {
              instructors: [],
              total: 0,
            };
          }

          const users = await this.userRepository.findUsersByIds(instructorIds);

          this.logger.info("ListInstructorsOfStudentUseCase succeeded.", {
            studentId,
            totalInstructors: total,
          });

          return {
            instructors: users.map(UserDto.fromDomain),
            total,
          };
        } catch (error) {
          this.logger.error(
            "Error in ListInstructorsOfStudentUseCase: " +
              (error?.message || error),
            error,
          );
          throw error;
        }
      },
    );
  }
}
