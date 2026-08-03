import { Controller } from "@nestjs/common";

import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { KafkaTopics } from "src/shared/events";
import { KafkaMessage } from "@/infrastructure/kafka/module/kafka.types";
import {
  CourseCreatedEvent,
  CourseEnrollmentEvent,
} from "src/domain/events/course.events";
import { CourseEnrolledHandler } from "../handlers/course-enrolled.handler";
import { CourseCreatedHandler } from "../handlers/course-created.handler";
import { EventPattern } from "@/infrastructure/kafka/module/kafka.decorators";

@Controller()
export class CourseConsumer {
  constructor(
    private readonly courseEnrolledHandler: CourseEnrolledHandler,
    private readonly courseCreatedHandler: CourseCreatedHandler,

    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  @EventPattern(KafkaTopics.CourseCreated)
  async handleCourseCreateEvent(
    data: KafkaMessage<CourseCreatedEvent>,
  ): Promise<void> {
    try {
      await this._tracer.startActiveSpan(
        "CourseConsumer.handleCourseComplete",
        async () => {
          this._logger.debug(
            "Received data : " + JSON.stringify(data, null, 2),
          );
          this._logger.debug("Handling `handleCourseComplete` event handler ", {
            ctx: CourseConsumer.name,
          });

          await this.courseCreatedHandler.handle(data.value);

          this._logger.debug(
            "handleCourseComplete event handle has been successfully completed",
          );
        },
      );
    } catch (error) {
      this._logger.error(
        "Error processing kafka even handler  `handleCourseComplete`",
        {
          error,
        },
      );
    }
  }

  @EventPattern(KafkaTopics.CourseEnrollmentCreated)
  async handleCourseEnrollmentEvent(
    data: KafkaMessage<CourseEnrollmentEvent>,
  ): Promise<void> {
    try {
      await this._tracer.startActiveSpan(
        "CourseConsumer.handleCourseEnrollmentEvent",
        async (span) => {
          this._logger.debug(
            "Handling `handleCourseEnrollmentEvent` request ",
            {
              ctx: CourseConsumer.name,
            },
          );

          await this.courseEnrolledHandler.handle(data.value);

          this._logger.debug(
            "handleCourseEnrollmentEvent request has been successfully completed",
          );
        },
      );
    } catch (error) {
      this._logger.error(
        "Error processing Kafka handler `handleCourseEnrollmentEvent`",
        {
          error,
        },
      );
    }
  }
}
