import { UserDto } from "src/application/dtos/user.dto";
import { ListStudentsOfInstructorRequest } from "src/infrastructure/grpc/generated/user/types/instructor_student";

export abstract class IListStudentsOfInstructorUseCase {
  /**
   * Lists the instructors of a student.
   * @param dto - The request DTO containing instructorId and pagination debug.
   */
  abstract execute(
    dto: ListStudentsOfInstructorRequest,
  ): Promise<{ students: UserDto[]; total: number }>;
}
