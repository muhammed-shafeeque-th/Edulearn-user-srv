import { Wallet } from "src/domain/entities/user-wallet.entity";
import { WalletTransaction as WalletTransactionEntity } from "src/domain/entities/wallet-transaction.entiy";
import {
  UserWalletData,
  WalletTransaction,
} from "src/infrastructure/grpc/generated/user/types/user_wallet_types";

export class WalletTransactionMapper {
  static toGrpcResponse(
    transaction: WalletTransactionEntity,
  ): WalletTransaction {
    return {
      amount: transaction.amount,
      id: transaction.id,
      relatedOrder: transaction.relatedOrder,
      status: transaction.status,
      timestamp: transaction.timestamp.toISOString(),
      type: transaction.type,
      note: transaction.note,
    };
  }
}

export class WalletMapper {
  static toGrpcResponse(wallet: Wallet): UserWalletData {
    return {
      createdAt: wallet.createdAt.toISOString(),
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency,
      transactions: wallet.transactions.map((t) =>
        WalletTransactionMapper.toGrpcResponse(t),
      ),
      updatedAt: wallet.updatedAt.toISOString(),
    };
  }
}
