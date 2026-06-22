import { Injectable } from "@nestjs/common";
import {
  CartItemNotFoundException,
  CartNotFoundException,
} from "src/domain/exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";

import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IRemoveFromCartUseCase } from "../interfaces/remove-cart.interface";

@Injectable()
export class RemoveFromCartUseCase implements IRemoveFromCartUseCase {
  constructor(
    private readonly _cartRepository: ICartRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(userId: string, courseId: string): Promise<void> {
    return await this._tracer.startActiveSpan(
      "RemoveFromCartUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });

        this._logger.debug(`Removing course ${courseId} from cart`, {
          ctx: RemoveFromCartUseCase.name,
        });
        const { cart: cartExist } =
          await this._cartRepository.findByUserId(userId);
        if (!cartExist) {
          throw new CartNotFoundException(`cart not found for ${userId}`);
        }

        const cart = await this._cartRepository.findItemByUserIdAndCourseId(
          cartExist.userId,
          courseId,
        );
        if (!cart) {
          span.setAttribute("cart.found", false);
          throw new CartItemNotFoundException(
            `cart Item not found for user ${cartExist.userId} with course ${courseId}`,
          );
        }
        span.setAttribute("cart.found", true);

        await this._cartRepository.removeItem(cartExist.id, courseId);
        span.setAttribute("cart.deleted", true);

        this._logger.debug(`cart item ${cart.id} deleted`, {
          ctx: RemoveFromCartUseCase.name,
        });
      },
    );
  }
}
