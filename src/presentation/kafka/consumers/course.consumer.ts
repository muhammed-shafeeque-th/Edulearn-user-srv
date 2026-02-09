import { Controller } from "@nestjs/common";

import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { KafkaTopics } from "src/shared/events";
import { KafkaMessage } from "src/infrastructure/kafka/kafka.types";
import { CourseCreatedEvent, CourseEnrollmentEvent } from "src/domain/events/course.events";
import { CourseEnrolledHandler } from "../handlers/course-enrolled.handler";
import { CourseCreatedHandler } from "../handlers/course-created.handler";
import { EventPattern } from "src/infrastructure/kafka/kafka.decorators";

@Controller()
export class CourseConsumer {
  constructor(
    private readonly courseEnrolledHandler: CourseEnrolledHandler,
    private readonly courseCreatedHandler: CourseCreatedHandler,

    private readonly tracer: TracingService,
    private readonly logger: LoggingService
  ) { }

   
  @EventPattern(KafkaTopics.CourseCreated)
  async handleCourseCreateEvent(
    data: KafkaMessage<CourseCreatedEvent>
  ): Promise<void> {
    try {
      await this.tracer.startActiveSpan(
        "CourseConsumer.handleCourseComplete",
        async () => {
          this.logger.debug("Received data : " + JSON.stringify(data, null, 2));
          this.logger.info("Handling `handleCourseComplete` event handler ", {
            ctx: CourseConsumer.name,
          });    

          await this.courseCreatedHandler.handle(data.value);

          this.logger.info(
            "handleCourseComplete event handle has been successfully completed"
          );

        }
      );
    } catch (error) {
      this.logger.error(
        "Error processing kafka even handler  `handleCourseComplete`",
        {
          error,
        }
      );
    }
  }

  @EventPattern(KafkaTopics.CourseEnrollmentCreated)
  async handleCourseEnrollmentEvent(
    data: KafkaMessage<CourseEnrollmentEvent>
  ): Promise<void> {
    try {
      await this.tracer.startActiveSpan(
        "CourseConsumer.handleCourseEnrollmentEvent",
        async (span) => {
          this.logger.info("Handling `handleCourseEnrollmentEvent` request ", {
            ctx: CourseConsumer.name,
          });

          await this.courseEnrolledHandler.handle(
            data.value
          );

          this.logger.info(
            "handleCourseEnrollmentEvent request has been successfully completed"
          );
        }
      );
    } catch (error) {
      this.logger.error(
        "Error processing Kafka handler `handleCourseEnrollmentEvent`",
        {
          error,
        }
      );
    }
  }
}
