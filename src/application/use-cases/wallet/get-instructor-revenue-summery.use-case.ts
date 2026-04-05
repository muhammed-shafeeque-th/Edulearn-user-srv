import { Injectable } from "@nestjs/common";
import {  UserWalletNotFoundException } from "src/domain/exceptions";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import {
  GetInstructorRevenueSummeryRequest,
  InstructorRevenueSummery,
} from "src/infrastructure/grpc/generated/user/types/stats_types";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";


@Injectable()
export class GetInstructorRevenueSummeryUseCase {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  /**
   * Fetch instructor's revenue summary information.
   * @param dto Information about the instructor.
   */
  async execute(
    dto: GetInstructorRevenueSummeryRequest
  ): Promise<InstructorRevenueSummery> {
    return this.tracer.startActiveSpan(
      "GetInstructorRevenueSummeryUseCase.execute",
      async (span) => {
        try {
          const instructorId = dto.instructorId;
          if (!instructorId) {
            this.logger.warn("Missing instructorId in request object", {
              ctx: GetInstructorRevenueSummeryUseCase.name,
            });
            throw new BadRequestException("InstructorId is required");
          }

          span.setAttributes({
            "instructor.id": instructorId,
          });

          this.logger.debug(
            `Fetching revenue summary for instructorId=${instructorId}`,
            { ctx: GetInstructorRevenueSummeryUseCase.name }
          );

          const revenueSummary = await this.walletRepository.getRevenueSummery(
            instructorId
          );

          if (!revenueSummary) {
            this.logger.warn(
              `Revenue summary not found for instructorId=${instructorId}`,
              { ctx: GetInstructorRevenueSummeryUseCase.name }
            );
            throw new UserWalletNotFoundException(
              `Revenue summary for instructor ${instructorId} not found`
            );
          }

          this.logger.debug(
            `Successfully retrieved revenue summary for instructorId=${instructorId}`,
            { ctx: GetInstructorRevenueSummeryUseCase.name }
          );

          return {
            totalEarnings: revenueSummary.totalEarnings ?? 0,
            thisMonthEarnings: revenueSummary.thisMonthEarnings ?? 0,
            lastMonthEarnings: revenueSummary.lastMonthEarnings ?? 0,
            thisWeekEarnings: revenueSummary.thisWeekEarnings ?? 0,
            todayEarnings: revenueSummary.todayEarnings ?? 0,
          };
        } catch (err) {
          span?.recordException?.(err);
          this.logger.error(
            `Failed to get instructor revenue summary. Reason: ${err?.message}`,
            { ctx: GetInstructorRevenueSummeryUseCase.name, error: err }
          );
          throw err;
        }
      }
    );
  }
}
