import { Controller } from '@nestjs/common';
import { UserHandler } from '../handlers/user.handler';
import { TracingService } from 'src/infrastructure/observability/tracing/trace.service';
import { LoggingService } from 'src/infrastructure/observability/logging/logging.service';
import { KafkaTopics } from 'src/shared/events';
import { KafkaMessage } from 'src/infrastructure/kafka/kafka.types';
import CreateUserDto from 'src/presentation/grpc/dtos/create-user.dto';
import { UserCreatedEvent } from 'src/domain/events/user-created.event';
import { EventPattern } from 'src/infrastructure/kafka/kafka.decorators';

@Controller()
export class UserConsumer {
    constructor(
        private readonly userHandler: UserHandler,
        private readonly tracer: TracingService,
        private readonly logger: LoggingService
    ) { }

    @EventPattern(KafkaTopics.AuthUserCreated)
  async handleUserCreate(data: KafkaMessage<UserCreatedEvent>): Promise<void> {
    try {
      await this.tracer.startActiveSpan(
        "UserConsumer.handleUserCreate",
        async (span) => {
          this.logger.info("Handling `handleUserCreate` request ", {
            ctx: UserConsumer.name,
          });

          await this.userHandler.handle(data.value);

          this.logger.info(
            "handleUserCreate request has been successfully completed"
          );
        }
      );
    } catch (error) {
      this.logger.error("Error processing kafka handler `handleUserCreate`", {
        error,
      });
    }
  }
}
