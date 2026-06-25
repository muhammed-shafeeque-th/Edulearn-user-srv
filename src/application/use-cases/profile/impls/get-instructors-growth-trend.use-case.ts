import { Injectable } from "@nestjs/common";
import {
  GrowthTrend,
  IUserRepository,
} from "src/domain/repositories/user.repository";
import { UsersStats } from "src/infrastructure/grpc/generated/user/types/stats_types";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IGetInstructorsGrowthTrendUseCase } from "../interfaces/get-instructors-growth-trend.interface";

@Injectable()
export default class GetInstructorsGrowthTrendUseCase
  implements IGetInstructorsGrowthTrendUseCase
{
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(year: number): Promise<GrowthTrend> {
    return this._tracer.startActiveSpan(
      "GetInstructorsGrowthTrendUseCase.execute",
      async (span) => {
        try {
          this._logger.debug("Executing GetInstructorsGrowthTrendUseCase");

          // Query the user repository for statistics
          const trend =
            await this._userRepository.getInstructorsGrowthTrend(year);

          this._logger.debug("GetInstructorsGrowthTrendUseCase succeeded.", {
            ...trend,
          });

          return trend;
        } catch (error: any) {
          this._logger.error(
            "Error in GetInstructorsGrowthTrendUseCase: " +
              (error?.message || error),
            { error },
          );
          throw error;
        }
      },
    );
  }
}
