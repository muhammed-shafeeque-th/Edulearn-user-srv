import User from "src/domain/entities/user-entity";
import { CourseEnrollmentEvent } from "src/domain/events/course.events";

export abstract class ICourseEnrolledUseCase {
  /**
   * Handles the course enrollment event.
   * - Updates instructor's student count and revenue.
   * - Ensures no duplicate revenue is credited per order.
   * @param dto CourseEnrollmentEventDto
   * @returns Updated User entity or null
   */
  abstract execute(dto: CourseEnrollmentEvent): Promise<User | null>;
}
