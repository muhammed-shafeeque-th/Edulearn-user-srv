import { Injectable } from "@nestjs/common";
import { CartNotFoundException } from "src/domain/exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IClearCartUseCase } from "../interfaces/clear-cart.interface";

@Injectable()
export class ClearCartUseCase implements IClearCartUseCase {
  constructor(
    private readonly _cartRepository: ICartRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(userId: string): Promise<void> {
    return await this._tracer.startActiveSpan(
      "ClearCartUseCase.execute",
      async (span) => {
        span.setAttribute("user.id", userId);

        this._logger.debug(`Clearing cart for user ${userId}`, {
          ctx: ClearCartUseCase.name,
        });

        const { cart: cartExist } =
          await this._cartRepository.findByUserId(userId);

        if (!cartExist) {
          this._logger.warn(`Cart not found for user ${userId}`, {
            ctx: ClearCartUseCase.name,
          });
          throw new CartNotFoundException(`cart not found for ${userId}`);
        }

        await this._cartRepository.clearCart(userId);

        span.setAttribute("cart.cleared", true);

        this._logger.debug(`Cart cleared for user ${userId}`, {
          ctx: ClearCartUseCase.name,
        });
      },
    );
  }
}
