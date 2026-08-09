import { CartItem } from "src/domain/entities/cart-item.entity";
import { Cart } from "src/domain/entities/cart.entity";
import {
  CartData,
  CartItemData,
} from "src/infrastructure/grpc/generated/user/types/cart_types";

export class CartItemMapper {
  static toGrpcResponse(item: CartItem): CartItemData {
    return {
      courseId: item.courseId,
      createdAt: item.addedAt.toISOString(),
      id: item.id,
    };
  }
}

export class CartResponseMapper {
  static toGrpcResponse(cart: Cart): CartData {
    return {
      createdAt: cart.createdAt.toISOString(),
      id: cart.id,
      items: cart.items.map((item) => CartItemMapper.toGrpcResponse(item)),
      total: cart.total,
      updatedAt: cart.updatedAt.toISOString(),
      userId: cart.userId,
    };
  }
}
