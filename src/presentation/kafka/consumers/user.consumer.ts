import { Controller } from "@nestjs/common";
import { UserHandler } from "../handlers/user.handler";

import { KafkaTopics } from "src/shared/events";
import { KafkaMessage } from "@/infrastructure/kafka/module/kafka.types";
import { UserAccountCreatedEvent } from "src/domain/events/user-created.event";
import { EventPattern } from "@/infrastructure/kafka/module/kafka.decorators";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";

@Controller()
export class UserConsumer {
  constructor(
    private readonly userHandler: UserHandler,
    private readonly _tracer: ITraceService,
    private readonly _logger: ILoggerService,
  ) {}

  @EventPattern(KafkaTopics.AuthUserCreated)
  async handleUserCreate(
    data: KafkaMessage<UserAccountCreatedEvent>,
  ): Promise<void> {
    try {
      await this._tracer.startActiveSpan(
        "UserConsumer.handleUserCreate",
        async (span) => {
          this._logger.debug("Handling `handleUserCreate` request ", {
            ctx: UserConsumer.name,
          });

          await this.userHandler.handle(data.value);

          this._logger.debug(
            "handleUserCreate request has been successfully completed",
          );
        },
      );
    } catch (error) {
      this._logger.error("Error processing kafka handler `handleUserCreate`", {
        error,
      });
    }
  }
}
