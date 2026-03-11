import { Injectable } from "@nestjs/common";
import { GrowthTrend, IUserRepository } from "src/domain/repositories/user.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";


@Injectable()
export default class GetUsersGrowthTrendUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}


  async execute(year: number): Promise<GrowthTrend> {
    return this.tracer.startActiveSpan(
      "GetUsersGrowthTrendUseCase.execute",
      async (span) => {
        try {
          this.logger.info("Executing GetUsersGrowthTrendUseCase");

          // Query the user repository for statistics
          const stats = await this.userRepository.getUsersGrowthTrend(year);

          this.logger.info("GetUsersGrowthTrendUseCase succeeded.", {
            ...stats,
          });

          return stats;
        } catch (error) {
          this.logger.error("Error in GetUsersGrowthTrendUseCase: " + (error?.message || error), error);
          throw error;
        } 
      }
    );
  }
}
