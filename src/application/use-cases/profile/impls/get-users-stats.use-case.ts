import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { UsersStats } from "src/infrastructure/grpc/generated/user/types/stats_types";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IGetUsersStatsUseCase } from "../interfaces/get-users-stats.interface";

@Injectable()
export default class GetUsersStatsUseCase implements IGetUsersStatsUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(): Promise<UsersStats> {
    return this._tracer.startActiveSpan(
      "GetUsersStatsUseCase.execute",
      async (span) => {
        try {
          this._logger.debug("Executing GetUsersStatsUseCase");

          // Query the user repository for statistics
          const stats = await this._userRepository.getUsersStats();

          this._logger.debug("GetUsersStatsUseCase succeeded.", {
            ...stats,
          });

          return stats;
        } catch (error: any) {
          this._logger.error(
            "Error in GetUsersStatsUseCase: " + (error?.message || error),
            error,
          );
          throw error;
        }
      },
    );
  }
}
