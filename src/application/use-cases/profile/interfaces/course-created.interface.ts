import User from "src/domain/entities/user-entity";
import { CourseCreatedEvent } from "src/domain/events/course.events";

export abstract class ICourseCreatedUseCase {
  abstract execute(dto: CourseCreatedEvent): Promise<User | null>;
}
