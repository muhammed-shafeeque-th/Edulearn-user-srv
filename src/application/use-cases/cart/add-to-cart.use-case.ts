import { Injectable } from "@nestjs/common";
import { CartItem } from "src/domain/entities/cart-item.entity";
import { Cart } from "src/domain/entities/cart.entity";
import {
  CartItemAlreadyExistException,
  CartItemNotFoundException,
} from "src/domain/exceptions/domain.exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { KafkaService } from "src/infrastructure/kafka/kafka.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AddToCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly kafkaProducer: KafkaService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(
    cartId: string,
    userId: string,
    courseId: string
  ): Promise<CartItem> {
    return await this.tracer.startActiveSpan(
      "AddToCartUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });
        this.logger.log(
          `Adding item to cart by user ${userId} for course ${courseId}`,
          { ctx: AddToCartUseCase.name }
        );

        const existCart = await this.cartRepository.findById(cartId);
        if (!existCart) {
          throw new CartItemNotFoundException(`cart ${cartId} not found`);
        }

        // Check if course exists
        const existCartItem = await this.cartRepository.findItemByUserIdAndCourseId(
          userId,
          courseId
        );
        if (existCartItem) {
          throw new CartItemAlreadyExistException(
            `course ${courseId} already exist in cart`
          );
        }

        // Create cart
        const cartItem = new CartItem(uuidv4(), courseId, existCart.getId());

        await this.cartRepository.addItem(cartItem);

        return cartItem;
      }
    );
  }
}
