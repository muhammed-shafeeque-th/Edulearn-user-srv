import { Injectable } from "@nestjs/common";
import { UserNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { KafkaService } from "src/infrastructure/kafka/kafka.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import UnBlockUserDto from "src/presentation/grpc/dtos/unblock-user.dto";
import { KafkaTopics } from "src/shared/events";
import { UserStatus } from "../../../domain/entities/user-entity";
import { UserDto } from "src/application/dtos/user.dto";
import { v4 as uuidV4 } from "uuid";
import { UserUnblockedEvent } from "src/domain/events/user-unblock.event";

@Injectable()
export default class UnBlockUserUserCaseImpl {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly kafkaProducer: KafkaService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }
  public async execute(dto: UnBlockUserDto): Promise<UserDto> {
    return await this.tracer.startActiveSpan(
      "UnBlockUserUserCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          userId: dto.userId,
        });

        this.logger.info(
          `Executing UnBlockUserUserCaseImpl for user : ${dto.userId}`
        );
        // Checks whether user exist with provided userId
        const user = await this.userRepository.findById(dto.userId);

        // Throws an error if user NOT exist with given userId
        if (!user) throw new UserNotFoundException(dto.userId);

        // Early return if the user not blocked
        if (user.status !== UserStatus.BLOCKED) {
          return UserDto.fromDomain(user);
        }

        // Change user status to blocked
        user.activate();

        await this.userRepository.update(dto.userId, user);

        await this.kafkaProducer.publish<UserUnblockedEvent>(
          {
            eventId: uuidV4(),
            eventType: "UserUnblockedEvent",
            timestamp: Date.now(),
            source: "user-service",
            eventVersion: "0.0.1",
            payload: {
              email: user.email,
              role: user.role,
              userId: user.id,
              avatar: user.avatar,
              firstName: user.firstName,
              status: UserStatus.ACTIVE,
            }
          },
          {
            topic: KafkaTopics.UserUnblocked,
            key: user.id,
          }
        );

        // Return updated user
        return UserDto.fromDomain(user);
      }
    );
  }
}
