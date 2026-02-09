import { CartItem } from "src/domain/entities/cart-item.entity";
import { Cart } from "src/domain/entities/cart.entity";
import { CartData, CartItemData } from "src/infrastructure/grpc/generated/user/types/cart_types";

export class CartItemDto {
  id: string;
  courseId: string;
  addedAt: Date;

  static fromDomain(cartItem: CartItem) {
    const dto = new CartItemDto();
    dto.addedAt = cartItem.addedAt;
    dto.courseId = cartItem.courseId;
    dto.id = cartItem.id;

    return dto;
  }

  public toGrpcResponse(): CartItemData {
    return {
      courseId: this.courseId,
      createdAt: this.addedAt.toISOString(),
      id: this.id,
    };
  }
}

export class CartDto {
  id: string;
  userId: string;
  courseId: string;
  total: number;
  items: CartItemDto[];
  comment: string;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(cart: Cart): CartDto {
    const dto = new CartDto();
    dto.id = cart.id;
    dto.userId = cart.userId;
    dto.total = cart.total;
    dto.createdAt = cart.createdAt;
    dto.updatedAt = cart.updatedAt;
    dto.items = cart.items.map(CartItemDto.fromDomain);

    return dto;
  }

  public toGrpcResponse(): CartData {
    return {
      createdAt: this.createdAt.toISOString(),
      id: this.id,
      items: this.items.map((item) => item.toGrpcResponse()),
      total: this.total,
      updatedAt: this.updatedAt.toISOString(),
      userId: this.userId,
    };
  }
}
