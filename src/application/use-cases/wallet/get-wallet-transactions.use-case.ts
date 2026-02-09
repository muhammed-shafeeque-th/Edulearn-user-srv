import { Injectable, NotFoundException } from "@nestjs/common";
import { WalletTransactionDto } from "src/application/dtos/wallet.dto";
import { UserWalletNotFoundException } from "src/domain/exceptions";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetWalletTransactionsUseCase {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  /**
   * Retrieve the transactions of a wallet by user id.
   * @param userId User identifier whose wallet transactions to retrieve.
   * @param page Pagination page number (1-based).
   * @param limit Number of transactions per page.
   */
  async execute(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<{ transactions: WalletTransactionDto[]; total: number }> {
    return this.tracer.startActiveSpan(
      "GetWalletTransactionsUseCase.execute",
      async (span) => {
        try {
          page = Number.isInteger(page) && page > 0 ? page : 1;
          limit = Number.isInteger(limit) && limit > 0 ? limit : 10;
          const offset = (page - 1) * limit;

          span.setAttributes({
            "user.id": userId,
            page,
            limit,
          });

          this.logger.debug(
            `Fetching wallet for userId=${userId}, page=${page}, limit=${limit}`,
            { ctx: GetWalletTransactionsUseCase.name }
          );

          const { wallet } = await this.walletRepository.findByUserId(userId);
          if (!wallet) {
            this.logger.warn(`Wallet not found for userId=${userId}`, {
              ctx: GetWalletTransactionsUseCase.name,
            });
            throw new UserWalletNotFoundException(`Wallet for user ${userId} not found`);
          }

          const { transactions: walletTransactions, totalTransactions } =
            await this.walletRepository.findTransactionsByWalletId(
              wallet.id,
              offset,
              limit
            );

          if (!walletTransactions) {
            this.logger.warn(
              `Transactions not found for walletId=${wallet.id}`,
              {
                ctx: GetWalletTransactionsUseCase.name,
              }
            );
            throw new UserWalletNotFoundException(
              `Transactions for wallet ${wallet.id} not found`
            );
          }

          this.logger.debug(
            `Successfully retrieved wallet transactions for walletId=${wallet.id}`,
            { ctx: GetWalletTransactionsUseCase.name }
          );

          return {
            transactions: walletTransactions.map(
              WalletTransactionDto.fromDomain
            ),
            total: totalTransactions || 0,
          };
        } catch (err) {
          span.recordException?.(err);
          this.logger.error(
            `Failed to get wallet transactions for userId: ${userId}. Reason: ${err?.message}`,
            { ctx: GetWalletTransactionsUseCase.name, error: err }
          );
          throw err;
        } 
      }
    );
  }
}
