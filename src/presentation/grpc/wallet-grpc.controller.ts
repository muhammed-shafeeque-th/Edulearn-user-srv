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

@Controller()
export class WalletGrpcController {
  constructor(
    private readonly getUserWalletUseCase: GetUserWalletUseCase,
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

  @GrpcMethod("UserService", "GetUserWallet")
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

  @GrpcMethod("UserService", "GetWalletTransactions")
  async getWalletTransactions(
    data: GetWalletTransactionsRequest
  ): Promise<GetWalletTransactionsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "WalletGrpcController.GetWalletTransactions",
        async (span) => {
          const { pagination, walletId } = data!;

          span.setAttributes({ ...pagination, walletId });
          this.logger.info("Handling `GetWalletTransactions` request ", {
            ctx: WalletGrpcController.name,
          });

          const { transactions, total } =
            await this.getWalletTransactionsUseCase.execute(
              walletId,
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
