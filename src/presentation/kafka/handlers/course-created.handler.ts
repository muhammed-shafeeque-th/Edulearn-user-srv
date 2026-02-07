import { Injectable, InternalServerErrorException } from '@nestjs/common';
import CourseCreatedUseCase from 'src/application/use-cases/user/course-created.use-case';
import CourseEnrolledUseCase from 'src/application/use-cases/user/course-enrolled.use-case';
import { COURSE_EVENT_TYPES, CourseCreatedEvent } from 'src/domain/events/course.events';
import { IEventProcessRepository } from 'src/domain/repositories/event-process-repository.interface';
import { LoggingService } from 'src/infrastructure/observability/logging/logging.service';
import { KafkaTopics } from 'src/shared/events';

@Injectable()
export class CourseCreatedHandler {
  constructor(
    private readonly eventProcessRepository: IEventProcessRepository,
    private readonly courseCreatedUseCase: CourseCreatedUseCase,
    private readonly logger: LoggingService,
  ) {}

  async handle(raw: CourseCreatedEvent) {
    const event = raw as CourseCreatedEvent;
    let alreadyProcessed: boolean;
    try {
      alreadyProcessed = await this.eventProcessRepository.isProcessed(
        event.eventId
      );
    } catch (err) {
      this.logger.error(
        `Error checking event process repository for eventId ${event.eventId}: ${err?.message}`,
        err?.stack
      );
      throw new InternalServerErrorException(
        "Could not verify event processing state"
      );
    }
    if (alreadyProcessed) {
      this.logger.debug(
        `[Event Already Processed] Skipping: ${event.eventId}`,
        { ctx: "CreateEnrollmentFromOrderUseCase" }
      );
      return;
    }

    // if (event.eventType === COURSE_EVENT_TYPES.CREATED) {

      await this.courseCreatedUseCase.execute(event);

      await this.eventProcessRepository.markAsProcessed(event.eventId);

        this.logger.info(
          `Successfully processed course created handler for topic ${KafkaTopics.CourseEnrollmentCreated}`
        );
    // }
  }
}
