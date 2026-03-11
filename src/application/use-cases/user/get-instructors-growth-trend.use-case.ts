import { Injectable } from "@nestjs/common";
import { GrowthTrend, IUserRepository } from "src/domain/repositories/user.repository";
import { UsersStats } from "src/infrastructure/grpc/generated/user/types/stats_types";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";


@Injectable()
export default class GetInstructorsGrowthTrendUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}


  async execute(year: number): Promise<GrowthTrend> {
    return this.tracer.startActiveSpan(
      "GetInstructorsGrowthTrendUseCase.execute",
      async (span) => {
        try {
          this.logger.info("Executing GetInstructorsGrowthTrendUseCase");

          // Query the user repository for statistics
          const trend = await this.userRepository.getInstructorsGrowthTrend(year);

          this.logger.info("GetInstructorsGrowthTrendUseCase succeeded.", {
            ...trend,
          });

          return trend;
        } catch (error) {
          this.logger.error("Error in GetInstructorsGrowthTrendUseCase: " + (error?.message || error), error);
          throw error;
        } 
      }
    );
  }
}
