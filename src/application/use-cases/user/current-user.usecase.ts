import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import User from "src/domain/entities/user.entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import CurrentUserDto from "src/presentation/grpc/dtos/current-user.dto";

@Injectable()
export default class CurrentUserUseCaseImpl {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}
  public async execute(dto: CurrentUserDto): Promise<UserDto> {
    return await this.tracer.startActiveSpan(
      "CurrentUserUseCaseImpl.execute",
      async (span) => {
        try {
          span.setAttributes({
            userId: dto.userId,
          });

          this.logger.info(
            `Executing CurrentUserUseCaseImpl for user : ${dto.userId}`
          );
          // Checks whether user exist with provided email
          const user = await this.userRepository.findById(dto.userId);

          // Throws an error if user NOT exist with given email
          if (!user) throw new UserNotFoundException(dto.userId);

          return UserDto.fromDomain(user);
        } catch (error) {
          this.logger.error(
            `Error while Executing CurrentUserUseCaseImpl for user : ${dto.userId}`,
            { error }
          );
          throw error;
        }
      }
    );
  }
}
