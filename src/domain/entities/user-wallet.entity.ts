import { v4 as uuidV4 } from "uuid";
import { WalletTransaction } from "./wallet-transaction.entiy";

export type WalletCurrency = "INR" | "USD";

// Wallet Aggregate Root

export interface WalletProps {
  id: string;
  userId: string;
  currency: WalletCurrency;
  balance: number;
  transactions?: WalletTransaction[];
  updatedAt?: Date;
  createdAt?: Date;
}

export class Wallet {
  private _balance: number;
  private readonly _id: string;
  private readonly _userId: string;
  private _transactions: WalletTransaction[];
  private _updatedAt: Date;
  private readonly _currency: WalletCurrency = "INR";
  private readonly _createdAt: Date;

  // Aggregate root encapsulates transactional state
  private constructor(props: WalletProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._balance = props.balance;
    this._transactions = props.transactions || [];
    this._createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this._updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }

  get balance(): number {
    return this._balance;
  }

  get transactions(): readonly WalletTransaction[] {
    // Expose as read-only array for encapsulation
    return this._transactions.slice();
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
  get currency(): WalletCurrency {
    return this._currency;
  }

  get totalTransactions(): number {
    return this._transactions.length;
  }

  // Business Logic/Behavior

  deposit(amount: number, note?: string, relatedOrder?: string): WalletTransaction {
    if (amount <= 0) throw new Error("Deposit amount must be positive");
    const transaction = WalletTransaction.create({
      walletId: this.id,
      amount,
      type: "deposit",
      status: "complete",
      note,
      relatedOrder
    });
    this._balance += amount;
    this._transactions.push(transaction);
    this._touch();
    return transaction;
  }

  withdraw(amount: number, note?: string): WalletTransaction {
    if (amount <= 0) throw new Error("Withdrawal amount must be positive");
    if (amount > this._balance) throw new Error("Insufficient balance");
    const transaction = WalletTransaction.create({
      walletId: this.id,
      amount: -amount,
      type: "withdrawal",
      status: "complete",
      note,
    });
    this._balance -= amount;
    this._transactions.push(transaction);
    this._touch();
    return transaction;
  }

  addTransaction(transaction: WalletTransaction): void {
    // Used for replay/persistence, or external events, with invariant checks
    this._transactions.push(transaction);
    this._balance += transaction.amount;
    this._touch();
  }

  calculateBalance(): number {
    return this._transactions.reduce((acc, tx) => acc + tx.amount, 0);
  }

  private _touch() {
    this._updatedAt = new Date();
  }

  // Optimized paginated access for large histories (for query use-cases)
  getTransactions({
    page = 1,
    pageSize = 10,
  }: {
    page?: number;
    pageSize?: number;
  }) {
    const start = (page - 1) * pageSize;
    return {
      transactions: this._transactions.slice(start, start + pageSize),
      total: this._transactions.length,
      page,
      pageSize,
    };
  }

  static createInitial(
    userId: string,
    currency: WalletCurrency = "USD"
  ): Wallet {
    return new Wallet({ id: uuidV4(), balance: 0, currency, userId });
  }

  static fromPrimitives(props: WalletProps): Wallet {
    return new Wallet({ ...props });
  }

  toPrimitives() {
    return {
      userId: this.userId,
      balance: this.balance,
      transactions: this.transactions.map((tx) => ({
        ...tx,
        timestamp: tx.timestamp.toISOString(),
      })),
      updatedAt: this.updatedAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}
