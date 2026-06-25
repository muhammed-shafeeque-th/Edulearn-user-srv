import { Injectable } from "@nestjs/common";
import User from "src/domain/entities/user-entity";
import { CourseCreatedEvent } from "src/domain/events/course.events";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ICourseCreatedUseCase } from "../interfaces/course-created.interface";

@Injectable()
export default class CourseCreatedUseCase implements ICourseCreatedUseCase {
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: CourseCreatedEvent): Promise<User | null> {
    return await this._tracer.startActiveSpan(
      "CourseCreatedUseCase.execute",
      async (span) => {
        const { payload } = dto;
        span.setAttributes({
          instructorId: payload.instructorId,
        });

        this._logger.debug(
          `Executing CourseCreatedUseCase for user : ${payload.instructorId}`,
        );
        // Checks whether user exist with provided userId
        const user = await this._userRepository.findById(payload.instructorId);

        if (!user) throw new UserNotFoundException(payload.instructorId);

        user.instructorProfile.incrementTotalCourse();

        const updatedUser = await this._userRepository.update(
          payload.instructorId,
          user,
        );

        return updatedUser;
      },
    );
  }
}
