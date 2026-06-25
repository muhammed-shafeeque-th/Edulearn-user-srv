import { Injectable } from "@nestjs/common";
import User from "src/domain/entities/user-entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { KafkaTopics } from "src/shared/events";
import { UserRoles, UserStatus } from "src/domain/entities/user-entity";
import { v4 as uuidV4 } from "uuid";
import { UserAccountUnblockedEvent } from "src/domain/events/user-unblock.event";
import { IUnBlockUserAccountUseCase } from "../interfaces/unblock-user-account.interface";
import { IEventPublisher } from "src/application/adaptors/event-producer";

@Injectable()
export default class UnBlockUserAccountUseCaseImpl
  implements IUnBlockUserAccountUseCase
{
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _eventPublisher: IEventPublisher,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: { userId: string }): Promise<User> {
    return await this._tracer.startActiveSpan(
      "UnBlockUserAccountUseCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          userId: dto.userId,
        });

        this._logger.debug(
          `Executing UnBlockUserAccountUseCaseImpl for user : ${dto.userId}`,
        );
        const user = await this._userRepository.findById(dto.userId);

        if (!user) {
          throw new UserNotFoundException(
            `User not found with Id ${dto.userId}`,
          );
        }

        if (user.status === UserStatus.ACTIVE) {
          return user;
        }

        user.unblockAccount();

        await this._userRepository.update(dto.userId, user);

        await this._eventPublisher.publish<UserAccountUnblockedEvent>(
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
            },
          },
          { topic: KafkaTopics.UserAccountUnblocked, key: user.id },
        );

        return user;
      },
    );
  }
}
