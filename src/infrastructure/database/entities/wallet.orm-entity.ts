import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { WalletTransactionOrmEntity } from "./wallet-transaction.orm-entity";
import { UserOrmEntity } from "./user.orm-entity";

@Entity("wallets")
export class WalletOrmEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  @Index()
  userId: string;

  @Column("decimal", { precision: 16, scale: 2, default: 0 })
  balance: number;

  @Column({ type: "varchar", default: "INR" })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => UserOrmEntity, (u) => u.wallet)
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;

  @OneToMany(
    () => WalletTransactionOrmEntity,
    (transaction) => transaction.wallet,
    {
      onDelete: "CASCADE",
      cascade: false, // Set cascade policy as needed
      eager: false, // Use query builder or relation loading for performance
    }
  )
  walletTransactions: WalletTransactionOrmEntity[];
}
