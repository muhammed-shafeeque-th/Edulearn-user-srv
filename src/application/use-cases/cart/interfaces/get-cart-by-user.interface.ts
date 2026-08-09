import { Cart } from "@/domain/entities/cart.entity";

export abstract class IGetCartByUserUseCase {
  abstract execute(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ cart: Cart | null; total: number }>;
}
