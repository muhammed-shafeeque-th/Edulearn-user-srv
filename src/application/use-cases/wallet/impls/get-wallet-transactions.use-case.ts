import { Injectable } from "@nestjs/common";
import { WalletTransactionDto } from "@/application/dtos/wallet.dto";
import { UserWalletNotFoundException } from "src/domain/exceptions";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IGetWalletTransactionsUseCase } from "../interfaces/get-wallet-transactions.interface";

@Injectable()
export class GetWalletTransactionsUseCase
  implements IGetWalletTransactionsUseCase
{
  constructor(
    private readonly _walletRepository: IWalletRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ transactions: WalletTransactionDto[]; total: number }> {
    return this._tracer.startActiveSpan(
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

          this._logger.debug(
            `Fetching wallet for userId=${userId}, page=${page}, limit=${limit}`,
            { ctx: GetWalletTransactionsUseCase.name },
          );

          const { wallet } = await this._walletRepository.findByUserId(userId);
          if (!wallet) {
            this._logger.warn(`Wallet not found for userId=${userId}`, {
              ctx: GetWalletTransactionsUseCase.name,
            });
            throw new UserWalletNotFoundException(
              `Wallet for user ${userId} not found`,
            );
          }

          const { transactions: walletTransactions, totalTransactions } =
            await this._walletRepository.findTransactionsByWalletId(
              wallet.id,
              offset,
              limit,
            );

          if (!walletTransactions) {
            this._logger.warn(
              `Transactions not found for walletId=${wallet.id}`,
              {
                ctx: GetWalletTransactionsUseCase.name,
              },
            );
            throw new UserWalletNotFoundException(
              `Transactions for wallet ${wallet.id} not found`,
            );
          }

          this._logger.debug(
            `Successfully retrieved wallet transactions for walletId=${wallet.id}`,
            { ctx: GetWalletTransactionsUseCase.name },
          );

          return {
            transactions: walletTransactions.map(
              WalletTransactionDto.fromDomain,
            ),
            total: totalTransactions || 0,
          };
        } catch (err: any) {
          this._logger.error(
            `Failed to get wallet transactions for userId: ${userId}. Reason: ${err?.message}`,
            { ctx: GetWalletTransactionsUseCase.name, error: err },
          );
          throw err;
        }
      },
    );
  }
}
