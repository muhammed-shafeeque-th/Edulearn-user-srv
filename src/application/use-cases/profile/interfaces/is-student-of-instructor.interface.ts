import { IsStudentOfInstructorRequest } from "src/infrastructure/grpc/generated/user/types/instructor_student";

export abstract class IIsStudentOfInstructorUseCase {
  /**
   * Checks if the studentId is a student of the instructorId.
   * @param dto - The DTO containing studentId and instructorId.
   * @returns An object indicating if the user is a student.
   */
  abstract execute(
    dto: IsStudentOfInstructorRequest,
  ): Promise<{ isStudent: boolean }>;
}
