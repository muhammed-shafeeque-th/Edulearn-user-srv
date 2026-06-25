import { WalletTransactionDto } from "@/application/dtos/wallet.dto";

export abstract class IGetWalletTransactionsUseCase {
  /**
   * Retrieve the transactions of a wallet by user id.
   * @param userId User identifier whose wallet transactions to retrieve.
   * @param page Pagination page number (1-based).
   * @param limit Number of transactions per page.
   */
  abstract execute(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{ transactions: WalletTransactionDto[]; total: number }>;
}
