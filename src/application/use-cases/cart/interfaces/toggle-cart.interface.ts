import { CartItemDto } from "@/application/dtos/cart.dto";

export abstract class IToggleCartUseCase {
  abstract execute(userId: string, courseId: string): Promise<CartItemDto>;
}
