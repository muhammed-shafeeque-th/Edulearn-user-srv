import { WalletDto } from "@/application/dtos/wallet.dto";

export abstract class IGetUserWalletUseCase {
  /**
   * Retrieve the wallet of a user, along with transaction total.
   * @param userId user identifier
   * @param page pagination page number (1-based)
   * @param limit number of transactions per page
   */
  abstract execute(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{ wallet: WalletDto; total: number }>;
}
