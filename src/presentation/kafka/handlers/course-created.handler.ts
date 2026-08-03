import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ICourseCreatedUseCase } from "@/application/use-cases/profile/interfaces/course-created.interface";
import { CourseCreatedEvent } from "src/domain/events/course.events";
import { IEventProcessRepository } from "src/domain/repositories/event-process-repository.interface";
import { KafkaTopics } from "src/shared/events";

@Injectable()
export class CourseCreatedHandler {
  constructor(
    private readonly eventProcessRepository: IEventProcessRepository,
    private readonly courseCreatedUseCase: ICourseCreatedUseCase,
    private readonly _logger: ILoggerService,
  ) {}

  async handle(raw: CourseCreatedEvent) {
    const event = raw as CourseCreatedEvent;
    let alreadyProcessed: boolean;
    try {
      alreadyProcessed = await this.eventProcessRepository.isProcessed(
        event.eventId,
      );
    } catch (err: any) {
      this._logger.error(
        `Error checking event process repository for eventId ${event.eventId}: ${err?.message}`,
        { err },
      );
      throw new InternalServerErrorException(
        "Could not verify event processing state",
      );
    }
    if (alreadyProcessed) {
      this._logger.debug(
        `[Event Already Processed] Skipping: ${event.eventId}`,
        { ctx: "CreateEnrollmentFromOrderUseCase" },
      );
      return;
    }

    // if (event.eventType === COURSE_EVENT_TYPES.CREATED) {

    await this.courseCreatedUseCase.execute(event);

    await this.eventProcessRepository.markAsProcessed(event.eventId);

    this._logger.debug(
      `Successfully processed course created handler for topic ${KafkaTopics.CourseEnrollmentCreated}`,
    );
    // }
  }
}
