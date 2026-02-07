import { v4 as uuidV4 } from "uuid";

export interface CartItemProps {
  id: string;
  courseId: string;
  cartId: string;
  price?: number;
  quantity?: number;
  addedAt: Date;
}

export class CartItem {
  private readonly _id: string;
  private readonly _courseId: string;
  private readonly _cartId: string;
  // private readonly _price: number;
  // private _quantity: number;
  private readonly _addedAt: Date;

  private constructor(props: CartItemProps) {
    this._id = props.id;
    this._courseId = props.courseId;
    this._cartId = props.cartId;
    // this._price = props.price;
    // this._quantity = props.quantity ?? 1;
    this._addedAt = new Date(props.addedAt);
  }

  static create(props: Omit<CartItemProps, "id" | "addedAt">): CartItem {
    return new CartItem({
      ...props,
      id: uuidV4(),
      addedAt: new Date(),
    });
  }

  static fromPrimitives(props: CartItemProps): CartItem {
    return new CartItem(props);
  }

  // Encapsulated getters

  get id(): string {
    return this._id;
  }

  get courseId(): string {
    return this._courseId;
  }

  get cartId(): string {
    return this._cartId;
  }

  // get price(): number {
  //   return this._price;
  // }

  // get quantity(): number {
  //   return this._quantity;
  // }

  get addedAt(): Date {
    return this._addedAt;
  }

  /**
   * Update the quantity for this cart item.
   * Prevents negative or zero quantity.
   */
  // updateQuantity(newQuantity: number): void {
  //   if (!Number.isInteger(newQuantity) || newQuantity < 1) {
  //     throw new Error("Quantity must be a positive integer.");
  //   }
  //   this._quantity = newQuantity;
  // }

  /**
   * Calculate the total price for this cart item (e.g., price * quantity).
   */
  // get total(): number {
  //   return this._price * this._quantity;
  // }

  toPrimitives(): CartItemProps {
    return {
      id: this._id,
      courseId: this._courseId,
      cartId: this._cartId,
      // price: this._price,
      // quantity: this._quantity,
      addedAt: new Date(this._addedAt),
    };
  }
}
