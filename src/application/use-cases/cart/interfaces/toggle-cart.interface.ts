import { CartItemDto } from "src/application/dtos/cart.dto";

export abstract class IToggleCartUseCase {
  abstract execute(userId: string, courseId: string): Promise<CartItemDto>;
}
