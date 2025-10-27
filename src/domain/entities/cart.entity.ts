import { CartItem } from "./cart-item.entity";

export class Cart {
  constructor(
    private readonly id: string,
    private readonly userId: string,
    private items: CartItem[],
    private readonly total: number,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getItems(): CartItem[] {
    return this.items;
  }

  getTotal(): number {
    return this.total;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  removeFromCart(cartId: string) {
    const updatedCart = this.items.filter((item) => item.getId() !== cartId);
    this.items = updatedCart;
    this.updatedAt = new Date();
  }
  addToCart(item: CartItem) {
    this.items.push(item);
    this.updatedAt = new Date();
  }
}
