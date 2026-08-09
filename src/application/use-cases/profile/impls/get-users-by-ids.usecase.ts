import { Injectable } from "@nestjs/common";
import User from "@/domain/entities/user-entity";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import GetUsersByIdsDto from "@/presentation/grpc/input-dtos/get-users-by-ids.dto";
import { IGetUsersByIdsUseCase } from "../interfaces/get-users-by-ids.interface";

@Injectable()
export default class GetUsersByIdsUseCase implements IGetUsersByIdsUseCase {
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: GetUsersByIdsDto): Promise<{ users: User[] }> {
    return await this._tracer.startActiveSpan(
      "GetUsersByIdsUseCase.execute",
      async (span) => {
        this._logger.debug(`Executing GetUsersByIdsUseCase `);
        // Checks users with limit and offset
        const users = await this._userRepository.findUsersByIds(dto.userIds);

        return { users: users };
      },
    );
  }
}
