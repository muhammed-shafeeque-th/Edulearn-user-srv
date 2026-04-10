import { Injectable } from "@nestjs/common";
import User from "src/domain/entities/user-entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { KafkaService } from "src/infrastructure/kafka/kafka.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { KafkaTopics } from "src/shared/events";
import {  UserRoles, UserStatus } from "src/domain/entities/user-entity";
import { v4 as uuidV4 } from "uuid";
import { UserAccountUnblockedEvent } from "src/domain/events/user-unblock.event";

@Injectable()
export default class UnBlockUserAccountUseCaseImpl {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly kafkaProducer: KafkaService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }
  public async execute(dto: { userId: string }): Promise<User> {
    return await this.tracer.startActiveSpan(
      "UnBlockUserAccountUseCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          userId: dto.userId,
        });

        this.logger.info(
          `Executing UnBlockUserAccountUseCaseImpl for user : ${dto.userId}`
        );
        const user = await this.userRepository.findById(dto.userId);

        if (!user) {
          throw new UserNotFoundException(
            `User not found with Id ${dto.userId}`
          );
        }
        
        if (user.status === UserStatus.ACTIVE) {
          return user;
        }

        user.unblockAccount();

        await this.userRepository.update(dto.userId, user);

        await this.kafkaProducer.publish<UserAccountUnblockedEvent>(
          {
            eventId: uuidV4(),
            eventType: "UserAccountUnBlockedEvent",
            timestamp: Date.now(),
            source: "user-service",
            eventVersion: "0.0.1",
            payload: {
              email: user.email,
              roles: user.roles,
              roleStatus: user.roleStatusMap,
              userId: user.id,
              avatar: user.avatar,
              firstName: user.firstName,
              status: UserStatus.ACTIVE,
            }
          },
          { topic: KafkaTopics.UserAccountUnblocked, key: user.id }
        );

        return user;
      }
    );
  }
}
