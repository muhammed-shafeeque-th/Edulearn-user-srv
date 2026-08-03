import { Wallet } from "@/domain/entities/user-wallet.entity";
import { FAKE_USER_ID } from "./constants";
import {
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
} from "@/domain/entities/wallet-transaction.entiy";

export function createMockWallet(userId = FAKE_USER_ID): Wallet {
  return Wallet.createInitial(userId, "INR");
}
type WalletTransactionProps = {
  walletId: string;
  amount?: number;
  type?: WalletTransactionType;
  status?: WalletTransactionStatus;
  relatedOrder?: string;
};

export function createMockWalletTransaction(
  overrides: WalletTransactionProps,
): WalletTransaction {
  return WalletTransaction.create({
    walletId: overrides.walletId,
    amount: overrides.amount ?? 0,
    type: overrides.type ?? "deposit",
    status: overrides.status ?? "complete",
    relatedOrder: overrides.relatedOrder ?? "order-1",
  });
}
