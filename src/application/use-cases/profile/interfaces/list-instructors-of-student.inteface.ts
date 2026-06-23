import { UserDto } from "src/application/dtos/user.dto";
import { ListInstructorsOfStudentRequest } from "src/infrastructure/grpc/generated/user/types/instructor_student";

export abstract class IListInstructorsOfStudentUseCase {
  /**
   * Lists the instructors of a student .
   * @param dto - The request DTO containing studentId and pagination debug.
   */
  abstract execute(
    dto: ListInstructorsOfStudentRequest,
  ): Promise<{ instructors: UserDto[]; total: number }>;
}
