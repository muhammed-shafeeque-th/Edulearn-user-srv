import { Injectable } from "@nestjs/common";
import { InstructorProfile } from "src/domain/entities/instructor-profile.entity";
import { UserNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { KafkaService } from "src/infrastructure/kafka/kafka.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import RegisterInstructorDto from "src/presentation/grpc/dtos/register-instructor.dto";
import {
  KafkaTopics,
} from "src/shared/events";
import { UserAlreadyExistException } from "../../../domain/exceptions/domain.exceptions";
import slugify from "slugify";
import { UserRoles } from "src/domain/entities/_user.entity";
import { UserDto } from "src/application/dtos/user.dto";
import { v4 as uuidV4 } from "uuid";
import { InstructorRegisterEvent } from "src/domain/events/register-instructor.event";

@Injectable()
export default class RegisterInstructorUseCase {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly kafkaProducer: KafkaService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }
  public async execute(dto: RegisterInstructorDto): Promise<UserDto | null> {
    return await this.tracer.startActiveSpan(
      "RegisterInstructorUseCase.execute",
      async (span) => {
        span.setAttributes({
          userId: dto.userId,
        });

        this.logger.info(
          `Executing RegisterInstructorUseCase for user : ${dto.userId}`
        );
        // Checks whether user exist with provided userId
        const user = await this.userRepository.findById(dto.userId);

        // Throws an error if user NOT exist with given userId
        if (!user) throw new UserNotFoundException(dto.userId);

        const usernameSlug = slugify(dto.username, {
          lower: true,
          strict: true,
        });

        const usernameExist =
          await this.userRepository.findByUserSlug(usernameSlug);
        if (usernameExist)
          throw new UserAlreadyExistException(
            `user already exist with ${dto.username}`
          );

        const instructor = InstructorProfile.create({
          userId: user.id,
          bio: dto.biography,
          education: dto.education,
          experience: dto.experience,
          expertise: dto.expertise,
          headline: dto.headline,
          tags: dto.tags,
        });

        user.promoteToInstructor(instructor);
        user.updateBasicData({ username: dto.username, slug: usernameSlug });

        const updatedUser = await this.userRepository.update(dto.userId, user);

        await this.kafkaProducer.publish<InstructorRegisterEvent>(
          {
            eventId: uuidV4(),
            eventType: "UserInstructorRegisteredEvent",
            timestamp: Date.now(),
            source: "user-service",
            eventVersion: "0.0.1",
            payload: {
              email: updatedUser.email,
              role: UserRoles.INSTRUCTOR,
              username: updatedUser.username,
              userId: updatedUser.id,
              avatar: updatedUser.avatar,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              status: updatedUser.status,
            }
          },
          {
            topic: KafkaTopics.UserInstructorRegistered,
            key: updatedUser.id,
          }
        );

        // Return updated user
        return UserDto.fromDomain(updatedUser);
      }
    );
  }
}
