import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { UsersStats } from "src/infrastructure/grpc/generated/user/types/stats_types";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";


@Injectable()
export default class GetUsersStatsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}


  async execute(): Promise<UsersStats> {
    return this.tracer.startActiveSpan(
      "GetUsersStatsUseCase.execute",
      async (span) => {
        try {
          this.logger.info("Executing GetUsersStatsUseCase");

          // Query the user repository for statistics
          const stats = await this.userRepository.getUsersStats();

          this.logger.info("GetUsersStatsUseCase succeeded.", {
            ...stats,
          });

          return stats;
        } catch (error) {
          this.logger.error("Error in GetUsersStatsUseCase: " + (error?.message || error), error);
          throw error;
        } 
      }
    );
  }
}
