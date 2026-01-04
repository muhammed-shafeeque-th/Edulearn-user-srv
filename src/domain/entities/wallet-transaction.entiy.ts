import { v4 as uuidV4 } from "uuid";

// Value Objects and Entities

export type WalletTransactionType = "deposit" | "withdrawal" | "purchase" | "refund";
export type WalletTransactionStatus = "pending" | "complete" | "failed";

export interface WalletTransactionProps {
  id: string;
  walletId: string;
//   userId?: string; // To support possible future querying by user
  amount: number;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  relatedOrder?: string;
  timestamp: Date;
  note?: string;
}

// Rich Domain Entity
export class WalletTransaction {
  private readonly _id: string;
  private readonly _walletId: string;
  private readonly _amount: number;
  private readonly _type: WalletTransactionType;
  private _status: WalletTransactionStatus;
  private readonly _relatedOrder?: string;
  private readonly _timestamp: Date;
  private readonly _note?: string;

  private constructor(props: WalletTransactionProps) {
    this._id = props.id;
    this._walletId = props.walletId;
    this._amount = Number(props.amount);
    this._type = props.type;
    this._status = props.status;
    this._relatedOrder = props.relatedOrder;
    this._timestamp = props.timestamp instanceof Date ? props.timestamp : new Date(props.timestamp);
    this._note = props.note;
  }

  // Accessors
  get id(): string {
    return this._id;
  }
  get walletId(): string {
    return this._walletId;
  }
  get amount(): number {
    return this._amount;
  }
  get type(): WalletTransactionType {
    return this._type;
  }
  get status(): WalletTransactionStatus {
    return this._status;
  }
  get relatedOrder(): string | undefined {
    return this._relatedOrder;
  }
  get timestamp(): Date {
    return this._timestamp;
  }
  get note(): string | undefined {
    return this._note;
  }

  // Domain Factory (creation always sets id & timestamp)
  static create(props: Omit<WalletTransactionProps, "id" | "timestamp">): WalletTransaction {
    return new WalletTransaction({
      ...props,
      id: uuidV4(),
      timestamp: new Date(),
    });
  }

  // Persistence rehydration
  static fromPrimitives(props: WalletTransactionProps): WalletTransaction {
    return new WalletTransaction(props);
  }

  // Domain state transitions
  public markComplete(): void {
    if (this._status === "complete") return;
    this._status = "complete";
  }
  public markFailed(): void {
    if (this._status === "failed") return;
    this._status = "failed";
  }

  // Value object for external layers (DTO, persistence)
  toPrimitives(): WalletTransactionProps {
    return {
      id: this._id,
      walletId: this._walletId,
      amount: this._amount,
      type: this._type,
      status: this._status,
      relatedOrder: this._relatedOrder,
      timestamp: this._timestamp,
      note: this._note,
    };
  }

  // Equality comparison (for testing or business rules)
  public equals(other: WalletTransaction): boolean {
    return (
      this.id === other.id &&
      this.walletId === other.walletId &&
      this.amount === other.amount &&
      this.type === other.type &&
      this.status === other.status &&
      this.relatedOrder === other.relatedOrder &&
      this.timestamp.getTime() === other.timestamp.getTime() &&
      this.note === other.note
    );
  }
}
