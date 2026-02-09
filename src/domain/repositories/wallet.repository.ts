import { WalletTransaction } from "../entities/wallet-transaction.entiy";
import { Wallet } from "../entities/user-wallet.entity";

export abstract class IWalletRepository {
  abstract save(wallet: Wallet): Promise<Wallet>;
  abstract delete(wallet: Wallet): Promise<void>;
  abstract findById(
    id: string
  ): Promise<{ wallet: Wallet | null; totalTransactions: number }>;
  abstract findByUserId(
    userId: string,
    offset?: number,
    limit?: number
  ): Promise<{ wallet: Wallet | null; totalTransactions: number }>;
  abstract update(wallet: Wallet): Promise<void>;
  abstract addTransaction(transaction: WalletTransaction): Promise<void>;
  abstract getRevenueSummery(instructorId: string): Promise<{
    totalEarnings: number;
    thisMonthEarnings: number;
    lastMonthEarnings: number;
    thisWeekEarnings: number;
    todayEarnings: number;
  } | null>;
  abstract findTransaction(
    transactionId: string
  ): Promise<WalletTransaction | null>;
  abstract findTransactionByWalletIdAndOrderId(
    walletId: string,
    orderId: string
  ): Promise<WalletTransaction | null>;
  abstract findTransactionsByWalletId(
    walletId: string,
    offset?: number,
    limit?: number
  ): Promise<{ transactions: WalletTransaction[]; totalTransactions: number }>;
}
