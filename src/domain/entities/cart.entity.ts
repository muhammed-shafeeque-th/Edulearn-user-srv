import { v4 as uuidV4 } from "uuid";
import { CartItem } from "./cart-item.entity";

export interface CartProps {
  id: string;
  userId: string;
  items?: CartItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Cart {
  private readonly _id: string;
  private readonly _userId: string;
  private _items: CartItem[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: CartProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._items = props.items ? [...props.items] : [];
    this._createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this._updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
  }

  static create(
    props: Omit<CartProps, "id" | "createdAt" | "updatedAt">,
  ): Cart {
    return new Cart({
      ...props,
      id: uuidV4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPrimitives(props: CartProps): Cart {
    return new Cart(props);
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get items(): ReadonlyArray<CartItem> {
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

  addToCart(item: CartItem): void {
    this._items.push(item);
    this.touch();
  }

  removeFromCart(itemId: string): void {
    this._items = this._items.filter((item) => item.id !== itemId);
    this.touch();
  }

  clearCart(): void {
    this._items = [];
    this.touch();
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
