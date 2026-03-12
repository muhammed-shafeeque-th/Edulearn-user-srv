import { Injectable } from "@nestjs/common";
import User from "src/domain/entities/user-entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { KafkaService } from "src/infrastructure/kafka/kafka.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import BlockUserDto from "src/presentation/grpc/dtos/block-user.dto";
import { KafkaTopics } from "src/shared/events";
import { UserStatus } from "../../../domain/entities/user-entity";
import { v4 as uuidV4 } from "uuid";
import { UserBlockedEvent } from "src/domain/events/user-block.event";

@Injectable()
export default class BlockUserUseCaseImpl {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly kafkaProducer: KafkaService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }
  public async execute(dto: BlockUserDto): Promise<User> {
    return await this.tracer.startActiveSpan(
      "BlockUserUserCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          userId: dto.userId,
        });

        this.logger.info(
          `Executing BlockUserUserCaseImpl for user : ${dto.userId}`
        );
        // Checks whether user exist with provided userId
        const user = await this.userRepository.findById(dto.userId);

        // Throws an error if user NOT exist with given userId
        if (!user) {
          throw new UserNotFoundException(
            `User not found with Id ${dto.userId}`
          );
        }
        // Early return if the user already blocked
        if (user.status === UserStatus.BLOCKED) {
          return user;
        }

        // Change user status to blocked
        user.block();

        await this.userRepository.update(dto.userId, user);

        await this.kafkaProducer.publish<UserBlockedEvent>(
          {
            eventId: uuidV4(),
            eventType: "UserBlockedEvent",
            timestamp: Date.now(),
            source: "user-service",
            eventVersion: "0.0.1",
            payload: {
              email: user.email,
              role: user.role,
              userId: user.id,
              avatar: user.avatar,
              firstName: user.firstName,
              status: UserStatus.BLOCKED,
            }
          },
          { topic: KafkaTopics.UserBlocked, key: user.id }
        );

        // Return updated user
        return user;
      }
    );
  }
}
