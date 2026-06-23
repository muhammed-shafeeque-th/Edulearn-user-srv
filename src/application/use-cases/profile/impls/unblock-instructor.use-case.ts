import { Injectable } from "@nestjs/common";
import User from "src/domain/entities/user-entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { KafkaTopics } from "src/shared/events";
import { RoleStatus, UserRoles } from "src/domain/entities/user-entity";
import { v4 as uuidV4 } from "uuid";
import { InstructorRoleUnBlockedEvent } from "src/domain/events/instructor.events";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";
import { IUnBlockInstructorRoleUseCase } from "../interfaces/unblock-instructor.interface";
import { IEventPublisher } from "src/application/adaptors/event-producer";

@Injectable()
export default class UnBlockInstructorRoleUseCaseImpl
  implements IUnBlockInstructorRoleUseCase
{
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _eventPublisher: IEventPublisher,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  public async execute(dto: { instructorId: string }): Promise<User> {
    return await this._tracer.startActiveSpan(
      "UnBlockInstructorRoleUseCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          instructorId: dto.instructorId,
        });

        this._logger.debug(
          `Executing UnBlockInstructorRoleUseCaseImpl for instructor : ${dto.instructorId}`,
        );
        const user = await this._userRepository.findById(dto.instructorId);

        if (!user) {
          throw new UserNotFoundException(
            `User not found with Id ${dto.instructorId}`,
          );
        }

        if (!user.isInstructor()) {
          throw new BadRequestException("User is not an instructor");
        }

        if (!user.isRoleBlocked(UserRoles.INSTRUCTOR)) {
          return user;
        }

        user.unblockRole(UserRoles.INSTRUCTOR);

        await this._userRepository.update(dto.instructorId, user);

        await this._eventPublisher.publish<InstructorRoleUnBlockedEvent>(
          {
            eventId: uuidV4(),
            eventType: "InstructorRoleUnBlockedEvent",
            timestamp: Date.now(),
            source: "user-service",
            eventVersion: "0.0.1",
            payload: {
              email: user.email,
              roles: user.roles,
              roleStatus: user.roleStatusMap,
              status: user.status,
              userId: user.id,
            },
          },
          { topic: KafkaTopics.UserInstructorUnblocked, key: user.id },
        );

        return user;
      },
    );
  }
}
