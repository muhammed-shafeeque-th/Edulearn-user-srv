import { Injectable } from "@nestjs/common";
import { UserDto } from "@/application/dtos/user.dto";
import { IInstructorStudentRepository } from "src/domain/repositories/instructor-student.repository";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ListInstructorsOfStudentRequest } from "src/infrastructure/grpc/generated/user/types/instructor_student";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IListInstructorsOfStudentUseCase } from "../interfaces/list-instructors-of-student.inteface";

@Injectable()
export default class ListInstructorsOfStudentUseCase
  implements IListInstructorsOfStudentUseCase
{
  public constructor(
    private readonly _instructorStudentRepository: IInstructorStudentRepository,
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    dto: ListInstructorsOfStudentRequest,
  ): Promise<{ instructors: UserDto[]; total: number }> {
    return this._tracer.startActiveSpan(
      "ListInstructorsOfStudentUseCase.execute",
      async (span) => {
        try {
          this._logger.debug("Executing ListInstructorsOfStudentUseCase", {
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
            await this._instructorStudentRepository.getInstructorsOfStudent({
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

          const users =
            await this._userRepository.findUsersByIds(instructorIds);

          this._logger.debug("ListInstructorsOfStudentUseCase succeeded.", {
            studentId,
            totalInstructors: total,
          });

          return {
            instructors: users.map(UserDto.fromDomain),
            total,
          };
        } catch (error: any) {
          this._logger.error(
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
