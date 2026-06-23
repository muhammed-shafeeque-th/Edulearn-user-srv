import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import { Gender, UserProfile } from "src/domain/entities/user-profile.entity";
import {
  SocialProvider,
  UserSocials,
} from "src/domain/entities/user-socials.entity";
import { UpdatedUserEvent } from "src/domain/events/update-user.event";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import UpdateUserDto from "src/presentation/grpc/dtos/update-user.dto";
import { KafkaTopics } from "src/shared/events";
import { v4 as uuidV4 } from "uuid";
import { IUpdateUserUseCase } from "../interfaces/update-user.interface";
import { IEventPublisher } from "src/application/adaptors/event-producer";

@Injectable()
export default class UpdateUserUseCaseImpl implements IUpdateUserUseCase {
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _eventPublisher: IEventPublisher,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: UpdateUserDto): Promise<UserDto | null> {
    return await this._tracer.startActiveSpan(
      "UpdateUserUseCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          userId: dto.userId,
        });

        this._logger.debug(
          `Executing UpdateUserUseCaseImpl for user : ${dto.userId}`,
        );
        // Checks whether user exist with provided userId
        const user = await this._userRepository.findById(dto.userId);

        // Throws an error if user NOT exist with given userId
        if (!user) throw new UserNotFoundException(dto.userId);

        user.updateBasicData({
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatar: dto.avatar,
        });
        if (!user.profile) {
          const userProfile = UserProfile.create({
            language: dto.language,
            userId: dto.userId,
            city: dto.city,
            bio: dto.biography,
            country: dto.country,
            gender: dto.gender as Gender,
            phone: dto.phone,
            website: dto.website,
          });

          user.setUserProfile(userProfile);
        } else {
          user.updateProfile({
            biography: dto.biography,
            city: dto.city,
            country: dto.country,
            gender: dto.gender as Gender,
            phone: dto.phone,
            language: dto.language,
            website: dto.website,
          });
        }
        const userSocials = user.socials ?? [];

        dto.socials?.forEach((param) => {
          const existingIdx = userSocials.findIndex(
            (social) => social.provider === param.provider,
          );
          if (existingIdx !== -1) {
            userSocials[existingIdx] = {
              id: userSocials[existingIdx].id,
              userId: userSocials[existingIdx].userId,
              createdAt: userSocials[existingIdx].createdAt,
              updatedAt: userSocials[existingIdx].updatedAt,
              provider: param.provider,
              profileUrl: param.profileUrl,
              providerUserId:
                param.providerUserUrl ??
                userSocials[existingIdx].providerUserId,
            } as UserSocials;
          } else {
            const newSocial = UserSocials.create({
              userId: user.id,
              provider: param.provider as SocialProvider,
              profileUrl: param.profileUrl,
              providerUserId: param.providerUserUrl,
            });
            userSocials.push(newSocial);
          }
        });
        user.setSocials(userSocials);

        const updatedUser = await this._userRepository.update(dto.userId, user);

        await this._eventPublisher.publish<UpdatedUserEvent>(
          {
            eventId: uuidV4(),
            eventType: "UserUpdatedEvent",
            timestamp: Date.now(),
            source: "user-service",
            eventVersion: "0.0.1",
            payload: {
              email: updatedUser.email,
              roles: updatedUser.roles,
              userId: updatedUser.id,
              avatar: updatedUser.avatar,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              status: updatedUser.status,
            },
          },
          {
            topic: KafkaTopics.UserAccountUpdated,
            key: updatedUser.id,
          },
        );

        // Return updated user
        return UserDto.fromDomain(updatedUser);
      },
    );
  }
}
