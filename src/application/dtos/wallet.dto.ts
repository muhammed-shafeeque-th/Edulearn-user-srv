import { Wallet } from "src/domain/entities/user-wallet.entity";
import { WalletTransaction as WalletTransactionEntity } from "src/domain/entities/wallet-transaction.entiy";
import { UserWalletData, WalletTransaction } from "src/infrastructure/grpc/generated/user/types/user_wallet_types";

export class WalletTransactionDto {
  id: string;
  userId: string;
  walletId: string;
  amount: number;
  type: string;
  status: string;
  relatedOrder?: string;
  timestamp: Date;
  note?: string;

  static fromDomain(transaction: WalletTransactionEntity) {
    const dto = new WalletTransactionDto();
    dto.id = transaction.id;
    // dto.userId = transaction.userId;
    dto.walletId = transaction.walletId;
    dto.amount = transaction.amount;
    dto.type = transaction.type;
    dto.status = transaction.status;
    dto.relatedOrder = transaction.relatedOrder;
    dto.timestamp = transaction.timestamp;
    dto.note = transaction.note;

    return dto;
  }

  public toGrpcResponse(): WalletTransaction {
    return {
      amount: this.amount,
      id: this.id,
      relatedOrder: this.relatedOrder,
      status: this.status,
      timestamp: this.timestamp.toISOString(),
      type: this.type,
      note: this.note,
    };
  }
}

export class WalletDto {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  transactions?: WalletTransactionDto[];
  updatedAt?: Date;
  createdAt?: Date;

  static fromDomain(wallet: Wallet): WalletDto {
    const dto = new WalletDto();
    dto.id = wallet.id;
    dto.userId = wallet.userId;
    dto.currency = wallet.currency;
    dto.balance = wallet.balance;
    dto.transactions = wallet.transactions.map(WalletTransactionDto.fromDomain);
    dto.updatedAt = wallet.updatedAt;
    dto.createdAt = wallet.createdAt;

    return dto;
  }

  public toGrpcResponse(): UserWalletData {
    return {
      createdAt: this.createdAt.toISOString(),
      userId: this.userId,
      balance: this.balance,
      currency: this.currency,
      transactions: this.transactions.map((t) => t.toGrpcResponse()),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
