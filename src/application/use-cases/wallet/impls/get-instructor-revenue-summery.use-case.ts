import { Injectable } from "@nestjs/common";
import { UserWalletNotFoundException } from "src/domain/exceptions";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import {
  GetInstructorRevenueSummeryRequest,
  InstructorRevenueSummery,
} from "src/infrastructure/grpc/generated/user/types/stats_types";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";
import { IGetInstructorRevenueSummeryUseCase } from "../interfaces/get-instructor-revenue-summery.interface";

@Injectable()
export class GetInstructorRevenueSummeryUseCase
  implements IGetInstructorRevenueSummeryUseCase
{
  constructor(
    private readonly _walletRepository: IWalletRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  /**
   * Fetch instructor's revenue summary information.
   * @param dto Information about the instructor.
   */
  async execute(
    dto: GetInstructorRevenueSummeryRequest,
  ): Promise<InstructorRevenueSummery> {
    return this._tracer.startActiveSpan(
      "GetInstructorRevenueSummeryUseCase.execute",
      async (span) => {
        try {
          const instructorId = dto.instructorId;
          if (!instructorId) {
            this._logger.warn("Missing instructorId in request object", {
              ctx: GetInstructorRevenueSummeryUseCase.name,
            });
            throw new BadRequestException("InstructorId is required");
          }

          span.setAttributes({
            "instructor.id": instructorId,
          });

          this._logger.debug(
            `Fetching revenue summary for instructorId=${instructorId}`,
            { ctx: GetInstructorRevenueSummeryUseCase.name },
          );

          const revenueSummary =
            await this._walletRepository.getRevenueSummery(instructorId);

          if (!revenueSummary) {
            this._logger.warn(
              `Revenue summary not found for instructorId=${instructorId}`,
              { ctx: GetInstructorRevenueSummeryUseCase.name },
            );
            throw new UserWalletNotFoundException(
              `Revenue summary for instructor ${instructorId} not found`,
            );
          }

          this._logger.debug(
            `Successfully retrieved revenue summary for instructorId=${instructorId}`,
            { ctx: GetInstructorRevenueSummeryUseCase.name },
          );

          return {
            totalEarnings: revenueSummary.totalEarnings ?? 0,
            thisMonthEarnings: revenueSummary.thisMonthEarnings ?? 0,
            lastMonthEarnings: revenueSummary.lastMonthEarnings ?? 0,
            thisWeekEarnings: revenueSummary.thisWeekEarnings ?? 0,
            todayEarnings: revenueSummary.todayEarnings ?? 0,
          };
        } catch (err: any) {
          this._logger.error(
            `Failed to get instructor revenue summary. Reason: ${err?.message}`,
            { ctx: GetInstructorRevenueSummeryUseCase.name, error: err },
          );
          throw err;
        }
      },
    );
  }
}
