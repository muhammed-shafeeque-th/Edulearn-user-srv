import { Injectable } from "@nestjs/common";
import { CartItemDto } from "src/application/dtos/cart.dto";
import { CartItem } from "src/domain/entities/cart-item.entity";
import { Cart } from "src/domain/entities/cart.entity";
import {
  CartNotFoundException,
} from "src/domain/exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { KafkaService } from "src/infrastructure/kafka/kafka.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class ToggleCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly kafkaProducer: KafkaService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(userId: string, courseId: string): Promise<CartItemDto> {
    return await this.tracer.startActiveSpan(
      "ToggleCartUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });
        this.logger.log(
          `Adding item to cart by user ${userId} for course ${courseId}`,
          { ctx: ToggleCartUseCase.name }
        );

        const { cart: existCart } =
          await this.cartRepository.findByUserId(userId);
        if (!existCart) {
          throw new CartNotFoundException(
            `cart not found for user ${userId}`
          );
        }

        let cartItem: CartItem;

        // Check if course exists
        cartItem = await this.cartRepository.findItemByUserIdAndCourseId(
          userId,
          courseId
        );
        if (cartItem) {
          await this.cartRepository.removeItem(existCart.id, courseId);
        } else {
          // Create cart
          cartItem = CartItem.create({ courseId, cartId: existCart.id });

          await this.cartRepository.addItem(cartItem);
        }

        return CartItemDto.fromDomain(cartItem);
      }
    );
  }
}
