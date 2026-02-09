import { Injectable } from "@nestjs/common";
import { CartItemNotFoundException } from "src/domain/exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class ClearCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(userId: string): Promise<void> {
    return await this.tracer.startActiveSpan(
      "ClearCartUseCase.execute",
      async (span) => {
        span.setAttribute("user.id", userId);

        this.logger.debug(`Clearing cart for user ${userId}`, {
          ctx: ClearCartUseCase.name,
        });

        const { cart: cartExist } = await this.cartRepository.findByUserId(userId);

        if (!cartExist) {
          this.logger.warn(`Cart not found for user ${userId}`, {
            ctx: ClearCartUseCase.name,
          });
          throw new CartItemNotFoundException(`cart not found for ${userId}`);
        }

        await this.cartRepository.clearCart(userId);

        span.setAttribute("cart.cleared", true);

        this.logger.debug(`Cart cleared for user ${userId}`, {
          ctx: ClearCartUseCase.name,
        });
      }
    );
  }
}
