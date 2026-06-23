import { Injectable } from "@nestjs/common";
import slugify from "slugify";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { UserDto } from "src/application/dtos/user.dto";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import DetailedUserDto from "src/presentation/grpc/dtos/get-user-by-username.dto";
import { IGetInstructorByUsernameUseCase } from "../interfaces/get-instructor-by-username.interface";

@Injectable()
export default class GetInstructorByUsernameUseCaseImpl
  implements IGetInstructorByUsernameUseCase
{
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: DetailedUserDto): Promise<UserDto> {
    return await this._tracer.startActiveSpan(
      "GetInstructorByUsernameUseCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          username: dto.username,
        });

        this._logger.debug(
          `Executing GetInstructorByUsernameUseCaseImpl for user : ${dto.username}`,
        );
        const usernameSlug = slugify(dto.username, {
          lower: true,
          strict: true,
        });

        const usernameExist =
          await this._userRepository.findByUserSlug(usernameSlug);

        // Checks whether user exist with provided email
        const user = await this._userRepository.findByUserSlug(dto.username);

        // Throws an error if user NOT exist with given email
        if (!user)
          throw new UserNotFoundException(
            `User not found with name ${dto.username}`,
          );

        return UserDto.fromDomain(user);
      },
    );
  }
}
