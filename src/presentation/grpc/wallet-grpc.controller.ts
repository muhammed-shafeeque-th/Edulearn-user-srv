import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { DomainException } from "src/domain/exceptions";
import { IGetUserWalletUseCase } from "src/application/use-cases/wallet/interfaces/get-user-wallet.interface";
import { IGetWalletTransactionsUseCase } from "src/application/use-cases/wallet/interfaces/get-wallet-transactions.interface";
import { Error } from "src/infrastructure/grpc/generated/user/common";
import {
  GetUserWalletRequest,
  GetUserWalletResponse,
  GetWalletTransactionsRequest,
  GetWalletTransactionsResponse,
} from "src/infrastructure/grpc/generated/user/types/user_wallet_types";
import {
  GetInstructorRevenueSummeryRequest,
  GetInstructorRevenueSummeryResponse,
} from "src/infrastructure/grpc/generated/user/types/stats_types";
import { IGetInstructorRevenueSummeryUseCase } from "src/application/use-cases/wallet/interfaces/get-instructor-revenue-summery.interface";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class WalletGrpcController {
  constructor(
    private readonly _getUserWalletUseCase: IGetUserWalletUseCase,
    private readonly _getInstructorRevenueSummeryUseCase: IGetInstructorRevenueSummeryUseCase,
    private readonly _getWalletTransactionsUseCase: IGetWalletTransactionsUseCase,

    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.code,
      message: error.message,
      details:
        "serializeError" in error && typeof error.serializeError === "function"
          ? error.serializeError()
          : [{ message: error.message }],
    };
  }

  @GrpcMethod("WalletService", "GetUserWallet")
  async getUserWallet(
    data: GetUserWalletRequest,
  ): Promise<GetUserWalletResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "WalletGrpcController.GetUserWallet",
        async (span) => {
          const { userId, pagination } = data!;

          span.setAttributes({ userId, ...pagination });
          this._logger.debug("Handling `GetUserWalletGetUserWallet` request ", {
            ctx: WalletGrpcController.name,
          });

          const { total, wallet } = await this._getUserWalletUseCase.execute(
            userId,
            pagination.page,
            pagination.pageSize,
          );

          this._logger.debug(
            "GetUserWalletGetUserWallet request has been successfully completed",
          );

          return {
            success: { wallet: wallet.toGrpcResponse(), total },
          };
        },
      );
    } catch (error) {
      this._logger.error(
        "Error processing gRPC request `GetUserWalletGetUserWallet`",
        {
          error,
        },
      );
      throw error;
    }
  }
  @GrpcMethod("WalletService", "GetInstructorRevenueSummery")
  async getInstructorRevenueSummery(
    data: GetInstructorRevenueSummeryRequest,
  ): Promise<GetInstructorRevenueSummeryResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "WalletGrpcController.GetInstructorRevenueSummery",
        async (span) => {
          this._logger.debug("Handling `GetInstructorRevenueSummery` request", {
            ctx: WalletGrpcController.name,
          });

          const revenueSummary =
            await this._getInstructorRevenueSummeryUseCase.execute(data);

          this._logger.debug(
            "GetInstructorRevenueSummery request has been successfully completed",
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
        },
      );
    } catch (error) {
      this._logger.error(
        "Error processing gRPC request `GetInstructorRevenueSummery`",
        {
          error,
        },
      );
      throw error;
    }
  }

  @GrpcMethod("WalletService", "GetWalletTransactions")
  async getWalletTransactions(
    data: GetWalletTransactionsRequest,
  ): Promise<GetWalletTransactionsResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "WalletGrpcController.GetWalletTransactions",
        async (span) => {
          const { pagination, userId } = data!;

          span.setAttributes({ ...pagination, userId });
          this._logger.debug("Handling `GetWalletTransactions` request ", {
            ctx: WalletGrpcController.name,
          });

          const { transactions, total } =
            await this._getWalletTransactionsUseCase.execute(
              userId,
              pagination.page,
              pagination.pageSize,
            );

          this._logger.debug(
            "GetWalletTransactions request has been successfully completed",
          );

          return {
            success: {
              transactions: transactions.map((transaction) =>
                transaction.toGrpcResponse(),
              ),
              total,
            },
          };
        },
      );
    } catch (error) {
      this._logger.error(
        "Error processing gRPC request `GetUserWalletGetUserWallet`",
        {
          error,
        },
      );
      throw error;
    }
  }
}
