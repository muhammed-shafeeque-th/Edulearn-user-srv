import { CartItem } from "src/domain/entities/cart-item.entity";

export abstract class IAddToCartUseCase {
  abstract execute(userId: string, courseId: string): Promise<CartItem>;
}
