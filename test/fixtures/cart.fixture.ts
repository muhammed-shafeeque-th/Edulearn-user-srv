import { CartItem } from "@/domain/entities/cart-item.entity";
import { Cart } from "@/domain/entities/cart.entity";
import { FAKE_COURSE_ID, FAKE_USER_ID } from "./constants";

export function createMockCart(userId = FAKE_USER_ID): Cart {
  return Cart.create({ userId });
}

export function createMockCartItem(
  cartId: string,
  courseId = FAKE_COURSE_ID,
): CartItem {
  return CartItem.create({ courseId, cartId });
}
