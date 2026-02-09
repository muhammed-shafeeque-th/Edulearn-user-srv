import { v4 as uuidV4 } from "uuid";
import { WishlistItem } from "./wishlist-item.entity";

export interface WishlistProps {
  id: string;
  userId: string;
  items?: WishlistItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

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

  static create(
    props: Omit<WishlistProps, "id" | "createdAt" | "updatedAt">,
  ): Wishlist {
    return new Wishlist({
      ...props,
      id: uuidV4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPrimitives(props: WishlistProps): Wishlist {
    return new Wishlist(props);
  }

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
    return this._items.length;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  addItem(item: WishlistItem): void {
    if (this._items.find((it) => it.id === item.id)) {
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

  toPrimitives(): WishlistProps {
    return {
      id: this._id,
      userId: this._userId,
      items: [...this._items],
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
