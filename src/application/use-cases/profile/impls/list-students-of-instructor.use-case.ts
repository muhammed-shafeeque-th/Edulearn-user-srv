import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import { IInstructorStudentRepository } from "src/domain/repositories/instructor-student.repository";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ListStudentsOfInstructorRequest } from "src/infrastructure/grpc/generated/user/types/instructor_student";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IListStudentsOfInstructorUseCase } from "../interfaces/list-students-of-instructor.inteface";

@Injectable()
export default class ListStudentsOfInstructorUseCase
  implements IListStudentsOfInstructorUseCase
{
  public constructor(
    private readonly _instructorStudentRepository: IInstructorStudentRepository,
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    dto: ListStudentsOfInstructorRequest,
  ): Promise<{ students: UserDto[]; total: number }> {
    return this._tracer.startActiveSpan(
      "ListStudentsOfInstructorUseCase.execute",
      async (span) => {
        try {
          const { pagination, instructorId } = dto;
          this._logger.debug("Executing ListStudentsOfInstructorUseCase", {
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
            await this._instructorStudentRepository.getStudentsOfInstructor({
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
            await this._userRepository.findUsersByIds(studentIds);

          this._logger.debug("ListStudentsOfInstructorUseCase succeeded.", {
            instructorId,
            totalInstructors: total,
          });

          return {
            students: instructors.map(UserDto.fromDomain),
            total,
          };
        } catch (error: any) {
          this._logger.error(
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
