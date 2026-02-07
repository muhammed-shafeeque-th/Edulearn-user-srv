import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import { GetUserWalletUseCase } from "src/application/use-cases/wallet/get-user-wallet.use-case";
import { GetWalletTransactionsUseCase } from "src/application/use-cases/wallet/get-wallet-transactions.use-case";
import { Error } from "src/infrastructure/grpc/generated/user/common";
import {
  GetUserWalletRequest,
  GetUserWalletResponse,
  GetWalletTransactionsRequest,
  GetWalletTransactionsResponse,
} from "src/infrastructure/grpc/generated/user/types/user_wallet_types";
import { GetInstructorRevenueSummeryRequest, GetInstructorRevenueSummeryResponse } from "src/infrastructure/grpc/generated/user/types/stats_types";
import { GetInstructorRevenueSummeryUseCase } from "src/application/use-cases/wallet/get-instructor-revenue-summery.use-case";

@Controller()
export class WalletGrpcController {
  constructor(
    private readonly getUserWalletUseCase: GetUserWalletUseCase,
    private readonly getInstructorRevenueSummeryUseCase: GetInstructorRevenueSummeryUseCase,
    private readonly getWalletTransactionsUseCase: GetWalletTransactionsUseCase,

    private readonly tracer: TracingService,
    private readonly logger: LoggingService
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.errorCode,
      message: error.message,
      details:
        "serializeError" in error && typeof error.serializeError === "function"
          ? error.serializeError()
          : [{ message: error.message }],
    };
  }

  @GrpcMethod("WalletService", "GetUserWallet")
  async getUserWallet(
    data: GetUserWalletRequest
  ): Promise<GetUserWalletResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "WalletGrpcController.GetUserWallet",
        async (span) => {
          const { userId, pagination } = data!;

          span.setAttributes({ userId, ...pagination });
          this.logger.info("Handling `GetUserWalletGetUserWallet` request ", {
            ctx: WalletGrpcController.name,
          });

          const { total, wallet } = await this.getUserWalletUseCase.execute(
            userId,
            pagination.page,
            pagination.pageSize
          );

          this.logger.info(
            "GetUserWalletGetUserWallet request has been successfully completed"
          );

          return {
            success: { wallet: wallet.toGrpcResponse(), total },
          };
        }
      );
    } catch (error) {
      this.logger.error(
        "Error processing gRPC request `GetUserWalletGetUserWallet`",
        {
          error,
        }
      );
      return { error: this.createErrorResponse(error) };
    }
  }
  @GrpcMethod("WalletService", "GetInstructorRevenueSummery")
  async getInstructorRevenueSummery(
    data: GetInstructorRevenueSummeryRequest
  ): Promise<GetInstructorRevenueSummeryResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "WalletGrpcController.GetInstructorRevenueSummery",
        async (span) => {
          this.logger.info("Handling `GetInstructorRevenueSummery` request", {
            ctx: WalletGrpcController.name,
          });

          const revenueSummary =
            await this.getInstructorRevenueSummeryUseCase.execute(data);

          this.logger.info(
            "GetInstructorRevenueSummery request has been successfully completed"
          );

          // The proto expects: total_earnings, this_month_earnings, last_month_earnings, this_week_earnings, today_earnings (all int32)
          return {
            success: {
              totalEarnings: revenueSummary.totalEarnings ?? 0,
              thisMonthEarnings: revenueSummary.thisMonthEarnings ?? 0,
              lastMonthEarnings: revenueSummary.lastMonthEarnings ?? 0,
              thisWeekEarnings: revenueSummary.thisWeekEarnings ?? 0,
              todayEarnings: revenueSummary.todayEarnings ?? 0,
            },
          };
        }
      );
    } catch (error) {
      this.logger.error(
        "Error processing gRPC request `GetInstructorRevenueSummery`",
        {
          error,
        }
      );
      return { error: this.createErrorResponse(error) };
    }
  }

  @GrpcMethod("WalletService", "GetWalletTransactions")
  async getWalletTransactions(
    data: GetWalletTransactionsRequest
  ): Promise<GetWalletTransactionsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "WalletGrpcController.GetWalletTransactions",
        async (span) => {
          const { pagination, userId } = data!;

          span.setAttributes({ ...pagination, userId });
          this.logger.info("Handling `GetWalletTransactions` request ", {
            ctx: WalletGrpcController.name,
          });

          const { transactions, total } =
            await this.getWalletTransactionsUseCase.execute(
              userId,
              pagination.page,
              pagination.pageSize
            );

          this.logger.info(
            "GetWalletTransactions request has been successfully completed"
          );

          return {
            success: {
              transactions: transactions.map((transaction) =>
                transaction.toGrpcResponse()
              ),
              total,
            },
          };
        }
      );
    } catch (error) {
      this.logger.error(
        "Error processing gRPC request `GetUserWalletGetUserWallet`",
        {
          error,
        }
      );
      return { error: this.createErrorResponse(error) };
    }
  }
}
