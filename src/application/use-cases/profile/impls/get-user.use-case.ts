import { Injectable } from "@nestjs/common";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { UserDto } from "@/application/dtos/user.dto";
import User from "src/domain/entities/user-entity";
import { UserNotFoundException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import DetailedUserDto from "@/presentation/grpc/__input-dtos/detailed-user.dto";
import { IGetUserUseCase } from "../interfaces/get-user.interface";

@Injectable()
export default class GetUserUseCaseImpl implements IGetUserUseCase {
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: DetailedUserDto): Promise<UserDto> {
    return await this._tracer.startActiveSpan(
      "GetUserUseCaseImpl.execute",
      async (span) => {
        span.setAttributes({
          userId: dto.userId,
        });

        this._logger.debug(
          `Executing GetUserUseCaseImpl for user : ${dto.userId}`,
        );
        // Checks whether user exist with provided email
        const user = await this._userRepository.findById(dto.userId);

        // Throws an error if user NOT exist with given email
        if (!user) throw new UserNotFoundException(dto.userId);

        return UserDto.fromDomain(user);
      },
    );
  }
}
