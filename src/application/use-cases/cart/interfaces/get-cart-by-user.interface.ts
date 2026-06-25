import { CartDto } from "src/application/dtos/cart.dto";

export abstract class IGetCartByUserUseCase {
  abstract execute(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ cart: CartDto | null; total: number }>;
}
