import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import User from "src/domain/entities/user-entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import CurrentUserDto from "src/presentation/grpc/dtos/current-user.dto";
import { ICurrentUserUseCase } from "../interfaces/current-user.interface";

@Injectable()
export default class CurrentUserUseCaseImpl implements ICurrentUserUseCase {
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: CurrentUserDto): Promise<UserDto> {
    return await this._tracer.startActiveSpan(
      "CurrentUserUseCaseImpl.execute",
      async (span) => {
        try {
          span.setAttributes({
            userId: dto.userId,
          });

          this._logger.debug(
            `Executing CurrentUserUseCaseImpl for user : ${dto.userId}`,
          );
          // Checks whether user exist with provided email
          const user = await this._userRepository.findById(dto.userId);

          // Throws an error if user NOT exist with given email
          if (!user) throw new UserNotFoundException(dto.userId);

          return UserDto.fromDomain(user);
        } catch (error) {
          this._logger.error(
            `Error while Executing CurrentUserUseCaseImpl for user : ${dto.userId}`,
            { error },
          );
          throw error;
        }
      },
    );
  }
}
