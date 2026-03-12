import { Injectable } from "@nestjs/common";
import User from "src/domain/entities/user-entity";
import { CourseCreatedEvent } from "src/domain/events/course.events";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export default class CourseCreatedUseCase {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}
  public async execute(dto: CourseCreatedEvent): Promise<User | null> {
    return await this.tracer.startActiveSpan(
      "CourseCreatedUseCase.execute",
      async (span) => {
        const {payload} = dto
        span.setAttributes({
          instructorId: payload.instructorId,
        });

        this.logger.info(
          `Executing CourseCreatedUseCase for user : ${payload.instructorId}`
        );
        // Checks whether user exist with provided userId
        const user = await this.userRepository.findById(payload.instructorId);

        if (!user) throw new UserNotFoundException(payload.instructorId);

        user.instructorProfile.incrementTotalCourse();

        const updatedUser = await this.userRepository.update(
          payload.instructorId,
          user
        );

        return updatedUser;
      }
    );
  }
}
