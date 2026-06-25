import { CartItem } from "@/domain/entities/cart-item.entity";
import { Cart } from "@/domain/entities/cart.entity";
import { ICartRepository } from "@/domain/repositories/cart.repository";

export class MockCartRepository extends ICartRepository {
  create = jest.fn<Promise<void>, [Cart]>();
  delete = jest.fn<Promise<void>, [Cart]>();
  findById = jest.fn<Promise<Cart | null>, [string]>();
  findItemByUserIdAndCourseId = jest.fn<
    Promise<CartItem | null>,
    [string, string]
  >();
  findByUserId = jest.fn<
    Promise<{ cart: Cart | null; totalItems: number }>,
    [string, number?, number?]
  >();
  update = jest.fn<Promise<void>, [Cart]>();
  addItem = jest.fn<Promise<void>, [CartItem]>();
  clearCart = jest.fn<Promise<void>, [string]>();
  removeItem = jest.fn<Promise<void>, [string, string]>();
}

export function createMockCartRepository(): jest.Mocked<ICartRepository> {
  return new MockCartRepository();
}
