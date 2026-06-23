import { Injectable } from "@nestjs/common";
import { InstructorProfile } from "src/domain/entities/instructor-profile.entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import RegisterInstructorDto from "src/presentation/grpc/dtos/register-instructor.dto";
import { KafkaTopics } from "src/shared/events";
import { UserAlreadyExistException } from "../../../../domain/exceptions";
import slugify from "slugify";
import { UserRoles } from "src/domain/entities/_user.entity";
import { UserDto } from "src/application/dtos/user.dto";
import { v4 as uuidV4 } from "uuid";
import { InstructorRegisterEvent } from "src/domain/events/register-instructor.event";
import { IRegisterInstructorUseCase } from "../interfaces/register-instructor.interface";
import { IEventPublisher } from "src/application/adaptors/event-producer";

@Injectable()
export default class RegisterInstructorUseCase
  implements IRegisterInstructorUseCase
{
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _eventPublisher: IEventPublisher,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: RegisterInstructorDto): Promise<UserDto | null> {
    return await this._tracer.startActiveSpan(
      "RegisterInstructorUseCase.execute",
      async (span) => {
        span.setAttributes({
          userId: dto.userId,
        });

        this._logger.debug(
          `Executing RegisterInstructorUseCase for user : ${dto.userId}`,
        );
        // Checks whether user exist with provided userId
        const user = await this._userRepository.findById(dto.userId);

        // Throws an error if user NOT exist with given userId
        if (!user) throw new UserNotFoundException(dto.userId);

        const usernameSlug = slugify(dto.username, {
          lower: true,
          strict: true,
        });

        const usernameExist =
          await this._userRepository.findByUserSlug(usernameSlug);
        if (usernameExist)
          throw new UserAlreadyExistException(
            `user already exist with ${dto.username}`,
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

        const updatedUser = await this._userRepository.update(dto.userId, user);

        await this._eventPublisher.publish<InstructorRegisterEvent>(
          {
            eventId: uuidV4(),
            eventType: "UserInstructorRegisteredEvent",
            timestamp: Date.now(),
            source: "user-service",
            eventVersion: "0.0.1",
            payload: {
              email: updatedUser.email,
              roles: [UserRoles.STUDENT, UserRoles.INSTRUCTOR],
              username: updatedUser.username,
              userId: updatedUser.id,
              avatar: updatedUser.avatar,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              status: updatedUser.status,
            },
          },
          {
            topic: KafkaTopics.UserInstructorRegistered,
            key: updatedUser.id,
          },
        );

        return UserDto.fromDomain(updatedUser);
      },
    );
  }
}
