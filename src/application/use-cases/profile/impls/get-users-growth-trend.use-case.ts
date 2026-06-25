import { Injectable } from "@nestjs/common";
import {
  GrowthTrend,
  IUserRepository,
} from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IGetUsersGrowthTrendUseCase } from "../interfaces/get-users-growth-trend.inteface";

@Injectable()
export default class GetUsersGrowthTrendUseCase
  implements IGetUsersGrowthTrendUseCase
{
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(year: number): Promise<GrowthTrend> {
    return this._tracer.startActiveSpan(
      "GetUsersGrowthTrendUseCase.execute",
      async (span) => {
        try {
          this._logger.debug("Executing GetUsersGrowthTrendUseCase");

          // Query the user repository for statistics
          const stats = await this._userRepository.getUsersGrowthTrend(year);

          this._logger.debug("GetUsersGrowthTrendUseCase succeeded.", {
            ...stats,
          });

          return stats;
        } catch (error: any) {
          this._logger.error(
            "Error in GetUsersGrowthTrendUseCase: " + (error?.message || error),
            { error },
          );
          throw error;
        }
      },
    );
  }
}
