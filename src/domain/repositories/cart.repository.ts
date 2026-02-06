import { CartItem } from "../entities/cart-item.entity";
import { Cart } from "../entities/cart.entity";

export abstract class ICartRepository {
  abstract create(cart: Cart): Promise<void>;
  abstract delete(cart: Cart): Promise<void>;
  abstract findById(id: string): Promise<Cart | null>;
  abstract findItemByUserIdAndCourseId(
    userId: string,
    courseId: string
  ): Promise<CartItem | null>;
  abstract findByUserId(
    userId: string,
    offset?: number,
    limit?: number
  ): Promise<{ cart: Cart | null; totalItems: number }>;
  abstract update(cart: Cart): Promise<void>;
  abstract addItem(cartItem: CartItem): Promise<void>;
  abstract clearCart(userId: string): Promise<void>;
  abstract removeItem(cartId: string, courseId: string): Promise<void>;
}
