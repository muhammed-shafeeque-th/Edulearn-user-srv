import { v4 as uuidV4 } from "uuid";
import { WishlistItem } from "./wishlist-item.entity";

// Value object for encapsulation and immutability
export interface WishlistProps {
  id: string;
  userId: string;
  items?: WishlistItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Aggregate Root: Wishlist
export class Wishlist {
  private readonly _id: string;
  private readonly _userId: string;
  private _items: WishlistItem[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: WishlistProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._items = props.items ? [...props.items] : [];
    this._createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this._updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
  }

  // Factory method for creation - generates new UUID & timestamps by default
  static create(props: Omit<WishlistProps, "id" | "createdAt" | "updatedAt">): Wishlist {
    return new Wishlist({
      ...props,
      id: uuidV4(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // From raw/primitives (DB rehydration, etc.)
  static fromPrimitives(props: WishlistProps): Wishlist {
    return new Wishlist(props);
  }

  // Encapsulated getters
  get id(): string {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }
  get items(): ReadonlyArray<WishlistItem> {
    return [...this._items];
  }
  get total(): number {
    // Always calculated for consistency
    return this._items.length;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business logic

  addItem(item: WishlistItem): void {
    if (this._items.find((it) => it.id === item.id)) {
      // Optionally: error or ignore duplicates
      return;
    }
    this._items.push(item);
    this._markUpdated();
  }

  removeItem(itemId: string): void {
    const initialLength = this._items.length;
    this._items = this._items.filter((item) => item.id !== itemId);
    if (this._items.length !== initialLength) {
      this._markUpdated();
    }
  }

  hasItem(itemId: string): boolean {
    return this._items.some((item) => item.id === itemId);
  }

  clear(): void {
    this._items = [];
    this._markUpdated();
  }

  private _markUpdated() {
    this._updatedAt = new Date();
  }

  // Serialization for persistence
  toPrimitives(): WishlistProps {
    return {
      id: this._id,
      userId: this._userId,
      items: [...this._items],
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
