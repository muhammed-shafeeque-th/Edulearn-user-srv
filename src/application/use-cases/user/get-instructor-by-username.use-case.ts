import { Injectable } from "@nestjs/common";
import slugify from "slugify";
import { UserDto } from "src/application/dtos/user.dto";
import { UserNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import DetailedUserDto from "src/presentation/grpc/dtos/get-user-by-username.dto";

@Injectable()
export default class GetInstructorByUsernameUseCaseImpl {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}
  public async execute(dto: DetailedUserDto): Promise<UserDto> {
    return await this.tracer.startActiveSpan(
      "GetInstructorByUsernameUseCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          username: dto.username,
        });

        this.logger.info(
          `Executing GetInstructorByUsernameUseCaseImpl for user : ${dto.username}`
        );
        const usernameSlug = slugify(dto.username, {
          lower: true,
          strict: true,
        });

        const usernameExist =
          await this.userRepository.findByUserSlug(usernameSlug);

        // Checks whether user exist with provided email
        const user = await this.userRepository.findByUserSlug(dto.username);

        // Throws an error if user NOT exist with given email
        if (!user)
          throw new UserNotFoundException(
            `User not found with name ${dto.username}`
          );

        return UserDto.fromDomain(user);
      }
    );
  }
}
