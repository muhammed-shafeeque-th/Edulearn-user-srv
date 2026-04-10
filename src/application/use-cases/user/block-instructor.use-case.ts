import { Injectable } from "@nestjs/common";
import User from "src/domain/entities/user-entity";
import {  UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { KafkaService } from "src/infrastructure/kafka/kafka.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { KafkaTopics } from "src/shared/events";
import { RoleStatus, UserRoles } from "../../../domain/entities/user-entity";
import { v4 as uuidV4 } from "uuid";
import { InstructorRoleBlockedEvent } from "src/domain/events/instructor.events";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";

@Injectable()
export default class BlockInstructorRoleUseCaseImpl {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly kafkaProducer: KafkaService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }
  
  public async execute(dto: { instructorId: string }): Promise<User> {
    return await this.tracer.startActiveSpan(
      "BlockInstructorRoleUseCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          instructorId: dto.instructorId,
        });

        this.logger.info(
          `Executing BlockInstructorRoleUseCaseImpl for instructor (user) : ${dto.instructorId}`
        );
        const user = await this.userRepository.findById(dto.instructorId);

        if (!user) {
          throw new UserNotFoundException(
            `User not found with Id ${dto.instructorId}`
          );
        }
        
        if (!user.isInstructor()) {
            throw new BadRequestException("User is not an instructor");
        }

        if (user.isRoleBlocked(UserRoles.INSTRUCTOR)) {
          return user;
        }

        user.blockRole(UserRoles.INSTRUCTOR);

        await this.userRepository.update(dto.instructorId, user);

        await this.kafkaProducer.publish<InstructorRoleBlockedEvent>(
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
            }
          },
          { topic: KafkaTopics.UserInstructorBlocked, key: user.id } 
        );

        return user;
      }
    );
  }
}
