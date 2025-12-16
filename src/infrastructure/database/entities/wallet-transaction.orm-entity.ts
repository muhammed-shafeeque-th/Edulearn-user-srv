import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { WalletOrmEntity } from "./wallet.orm-entity";
import {
  WalletTransactionStatus,
  WalletTransactionType,
} from "src/domain/entities/wallet-transaction.entiy";

// export type WalletTransactionType = "deposit" | "withdrawal";
// export type WalletTransactionStatus = "pending" | "complete" | "failed";

@Entity("wallet_transactions")
@Index(["userId", "timestamp"])
@Index(["relatedOrder"])
export class WalletTransactionOrmEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid", { nullable: true })
  @Index()
  userId: string;

  @ManyToOne(() => WalletOrmEntity, { nullable: false })
  @JoinColumn({ name: "walletId" })
  wallet: WalletOrmEntity;

  @Column("uuid")
  walletId: string;

  @Column("decimal", { precision: 16, scale: 2 })
  amount: number;

  @Column({
    type: "enum",
    enum: ["deposit", "withdrawal", "purchase", "refund"],
  })
  type: WalletTransactionType;

  @Column({
    type: "enum",
    enum: ["pending", "complete", "failed"],
    default: "pending",
  })
  status: WalletTransactionStatus;

  @Column({ type: "varchar", nullable: true })
  relatedOrder?: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: "text", nullable: true })
  note?: string;
}
