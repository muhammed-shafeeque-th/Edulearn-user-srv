import { Injectable } from "@nestjs/common";
import { CartItemNotFoundException } from "src/domain/exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";

import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class RemoveFromCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(userId: string, courseId: string): Promise<void> {
    return await this.tracer.startActiveSpan(
      "RemoveFromCartUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });

        this.logger.debug(`Removing course ${courseId} from cart`, {
          ctx: RemoveFromCartUseCase.name,
        });
        const { cart: cartExist } =
          await this.cartRepository.findByUserId(userId);
        if (!cartExist) {
          throw new CartItemNotFoundException(`cart not found for ${userId}`);
        }

        const cart = await this.cartRepository.findItemByUserIdAndCourseId(
          cartExist.userId,
          courseId
        );
        if (!cart) {
          span.setAttribute("cart.found", false);
          throw new CartItemNotFoundException(
            `cart Item not found for user ${cartExist.userId} with course ${courseId}`
          );
        }
        span.setAttribute("cart.found", true);

        await this.cartRepository.removeItem(cartExist.id, courseId);
        span.setAttribute("cart.deleted", true);

        this.logger.debug(`cart item ${cart.id} deleted`, {
          ctx: RemoveFromCartUseCase.name,
        });
      }
    );
  }
}
