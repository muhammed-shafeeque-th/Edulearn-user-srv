import { Wallet } from "@/domain/entities/user-wallet.entity";
import { IWalletRepository } from "@/domain/repositories/wallet.repository";
import { WalletTransaction } from "@/infrastructure/grpc/generated/user/types/user_wallet_types";

export class MockWalletRepository extends IWalletRepository {
  save = jest.fn<Promise<Wallet>, [Wallet]>();
  delete = jest.fn<Promise<void>, [Wallet]>();
  findById = jest.fn<
    Promise<{ wallet: Wallet | null; totalTransactions: number }>,
    [string]
  >();
  findByUserId = jest.fn<
    Promise<{ wallet: Wallet | null; totalTransactions: number }>,
    [string, number?, number?]
  >();
  update = jest.fn<Promise<void>, [Wallet]>();
  addTransaction = jest.fn<Promise<void>, [WalletTransaction]>();
  getRevenueSummery = jest.fn<
    Promise<{
      totalEarnings: number;
      thisMonthEarnings: number;
      lastMonthEarnings: number;
      thisWeekEarnings: number;
      todayEarnings: number;
    } | null>,
    [string]
  >();
  findTransaction = jest.fn<Promise<WalletTransaction | null>, [string]>();
  findTransactionByWalletIdAndOrderId = jest.fn<
    Promise<WalletTransaction | null>,
    [string, string]
  >();
  findTransactionsByWalletId = jest.fn<
    Promise<{ transactions: WalletTransaction[]; totalTransactions: number }>,
    [string, number?, number?]
  >();
}

export function createMockWalletRepository(): jest.Mocked<IWalletRepository> {
  return new MockWalletRepository();
}
