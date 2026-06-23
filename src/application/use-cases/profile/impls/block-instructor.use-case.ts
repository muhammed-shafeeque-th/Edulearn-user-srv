import { Injectable } from "@nestjs/common";
import User from "src/domain/entities/user-entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { KafkaTopics } from "src/shared/events";
import { RoleStatus, UserRoles } from "../../../../domain/entities/user-entity";
import { v4 as uuidV4 } from "uuid";
import { InstructorRoleBlockedEvent } from "src/domain/events/instructor.events";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";
import { IEventPublisher } from "src/application/adaptors/event-producer";
import { IBlockInstructorRoleUseCase } from "../interfaces/block-instructor.interface";

@Injectable()
export default class BlockInstructorRoleUseCaseImpl
  implements IBlockInstructorRoleUseCase
{
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _eventPublisher: IEventPublisher,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  public async execute(dto: { instructorId: string }): Promise<User> {
    return await this._tracer.startActiveSpan(
      "BlockInstructorRoleUseCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          instructorId: dto.instructorId,
        });

        this._logger.debug(
          `Executing BlockInstructorRoleUseCaseImpl for instructor (user) : ${dto.instructorId}`,
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

        if (user.isRoleBlocked(UserRoles.INSTRUCTOR)) {
          return user;
        }

        user.blockRole(UserRoles.INSTRUCTOR);

        await this._userRepository.update(dto.instructorId, user);

        await this._eventPublisher.publish<InstructorRoleBlockedEvent>(
          {
            eventId: uuidV4(),
            eventType: "InstructorRoleBlockedEvent",
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
          { topic: KafkaTopics.UserInstructorBlocked, key: user.id },
        );

        return user;
      },
    );
  }
}
