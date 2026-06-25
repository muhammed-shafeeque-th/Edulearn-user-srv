import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { InstructorsStats } from "src/infrastructure/grpc/generated/user/types/stats_types";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IGetInstructorsStatsUseCase } from "../interfaces/get-instructors-stats.interface";

@Injectable()
export default class GetInstructorsStatsUseCase
  implements IGetInstructorsStatsUseCase
{
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(): Promise<InstructorsStats> {
    return this._tracer.startActiveSpan(
      "GetInstructorsStatsUseCase.execute",
      async (span) => {
        try {
          this._logger.debug("Executing GetInstructorsStatsUseCase");

          const stats = await this._userRepository.getInstructorsStats();

          this._logger.debug("GetInstructorsStatsUseCase succeeded.", {
            ...stats,
          });

          return stats;
        } catch (error: any) {
          this._logger.error(
            "Error in GetInstructorsStatsUseCase: " + (error?.message || error),
            error,
          );
          throw error;
        }
      },
    );
  }
}
