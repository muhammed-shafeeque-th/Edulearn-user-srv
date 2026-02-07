import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { InstructorsStats } from "src/infrastructure/grpc/generated/user/types/stats_types";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

/**
 * Use case to retrieve statistics about instructors in the system.
 */
@Injectable()
export default class GetInstructorsStatsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  /**
   * Retrieves aggregate statistics about users.
   * @returns Object containing the instructors stats.
   */
  async execute(): Promise<InstructorsStats> {
    return this.tracer.startActiveSpan(
      "GetInstructorsStatsUseCase.execute",
      async (span) => {
        try {
          this.logger.info("Executing GetInstructorsStatsUseCase");

          // Query the user repository for statistics
          const stats = await this.userRepository.getInstructorsStats();

          this.logger.info("GetInstructorsStatsUseCase succeeded.", {
            ...stats,
          });

          return stats;
        } catch (error) {
          this.logger.error("Error in GetInstructorsStatsUseCase: " + (error?.message || error), error);
          throw error;
        } 
      }
    );
  }
}
