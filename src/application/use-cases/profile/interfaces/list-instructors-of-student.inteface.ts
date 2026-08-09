import User from "@/domain/entities/user-entity";
import { ListInstructorsOfStudentRequest } from "src/infrastructure/grpc/generated/user/types/instructor_student";

export abstract class IListInstructorsOfStudentUseCase {
  /**
   * Lists the instructors of a student .
   * @param dto - The request DTO containing studentId and pagination debug.
   */
  abstract execute(
    dto: ListInstructorsOfStudentRequest,
  ): Promise<{ instructors: User[]; total: number }>;
}
