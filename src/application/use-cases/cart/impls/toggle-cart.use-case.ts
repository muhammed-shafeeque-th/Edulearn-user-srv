import { Injectable } from "@nestjs/common";
import { CartItemDto } from "src/application/dtos/cart.dto";
import { CartItem } from "src/domain/entities/cart-item.entity";
import { Cart } from "src/domain/entities/cart.entity";
import { CartNotFoundException } from "src/domain/exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IToggleCartUseCase } from "../interfaces/toggle-cart.interface";

@Injectable()
export class ToggleCartUseCase implements IToggleCartUseCase {
  constructor(
    private readonly _cartRepository: ICartRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(userId: string, courseId: string): Promise<CartItemDto> {
    return await this._tracer.startActiveSpan(
      "ToggleCartUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });
        this._logger.log(
          `Adding item to cart by user ${userId} for course ${courseId}`,
          { ctx: ToggleCartUseCase.name },
        );

        const { cart: existCart } =
          await this._cartRepository.findByUserId(userId);
        if (!existCart) {
          throw new CartNotFoundException(`cart not found for user ${userId}`);
        }

        let cartItem: CartItem;

        // Check if course exists
        cartItem = await this._cartRepository.findItemByUserIdAndCourseId(
          userId,
          courseId,
        );
        if (cartItem) {
          await this._cartRepository.removeItem(existCart.id, courseId);
        } else {
          // Create cart
          cartItem = CartItem.create({ courseId, cartId: existCart.id });

          await this._cartRepository.addItem(cartItem);
        }

        return CartItemDto.fromDomain(cartItem);
      },
    );
  }
}
