import { Injectable } from "@nestjs/common";
import { UserDto } from "@/application/dtos/user.dto";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import GetUsersByIdsDto from "@/presentation/grpc/__input-dtos/get-users-by-ids.dto";
import { IGetUsersByIdsUseCase } from "../interfaces/get-users-by-ids.interface";

@Injectable()
export default class GetUsersByIdsUseCase implements IGetUsersByIdsUseCase {
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: GetUsersByIdsDto): Promise<{ users: UserDto[] }> {
    return await this._tracer.startActiveSpan(
      "GetUsersByIdsUseCase.execute",
      async (span) => {
        this._logger.debug(`Executing GetUsersByIdsUseCase `);
        // Checks users with limit and offset
        const users = await this._userRepository.findUsersByIds(dto.userIds);

        return { users: users.map(UserDto.fromDomain) };
      },
    );
  }
}
