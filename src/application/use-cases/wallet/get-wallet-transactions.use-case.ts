import { Injectable, NotFoundException } from "@nestjs/common";
import {
  WalletDto,
  WalletTransactionDto,
} from "src/application/dtos/wallet.dto";
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
   * Retrieve the transactions of wallet with id.
   * @param walletId wallet identifier
   * @param page pagination page number (1-based)
   * @param limit number of transactions per page
   */
  async execute(
    walletId: string,
    page = 1,
    limit = 10
  ): Promise<{ transactions: WalletTransactionDto[]; total: number }> {
    return this.tracer.startActiveSpan(
      "GetWalletTransactionsUseCase.execute",
      async (span) => {
        try {
          if (page < 1) page = 1;
          if (limit < 1) limit = 10;

          const offset = (page - 1) * limit;

          span.setAttributes({
            "wallet.id": walletId,
            page: page,
            limit: limit,
          });

          this.logger.debug(
            `Fetching wallet for Id=${walletId}, page=${page}, limit=${limit}`,
            { ctx: GetWalletTransactionsUseCase.name }
          );

          // Repository handles pagination and returns both wallet and transactions count
          const { transactions: walletTransactions, totalTransactions } =
            await this.walletRepository.findTransactionsByWalletId(
              walletId,
              offset,
              limit
            );

          if (!walletTransactions) {
            this.logger.warn(`Wallet not found for Id=${walletId}`, {
              ctx: GetWalletTransactionsUseCase.name,
            });
            throw new NotFoundException(`Wallet ${walletId} not found`);
          }

          this.logger.debug(
            `Successfully retrieved wallet transactions for walletId=${walletId}`,
            { ctx: GetWalletTransactionsUseCase.name }
          );

          return {
            transactions: walletTransactions.map(
              WalletTransactionDto.fromDomain
            ),
            total: totalTransactions,
          };
        } catch (err) {
          span.recordException?.(err);
          this.logger.error(
            `Failed to get wallet for id: ${walletId}. Reason: ${err?.message}`,
            { ctx: GetWalletTransactionsUseCase.name, error: err }
          );
          throw err;
        }
      }
    );
  }
}
