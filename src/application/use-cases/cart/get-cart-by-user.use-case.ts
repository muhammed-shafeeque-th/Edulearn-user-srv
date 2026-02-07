import { Injectable } from "@nestjs/common";
import { CartDto } from "src/application/dtos/cart.dto";
import { Cart } from "src/domain/entities/cart.entity";
import { CartNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetCartByUserUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ cart: CartDto | null; total: number }> {
    return await this.tracer.startActiveSpan(
      "GetCartByUserUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
        });
        this.logger.log(`Fetching cart for user ${userId}`, {
          ctx: GetCartByUserUseCase.name,
        });
        // Page should be >= 1, fallback if not
        const safePage = Math.max(Number(page) || 1, 1);
        const safePageSize = Math.max(Number(limit) || 10, 1);

        // Offset is (page - 1) * limit
        const offset = (safePage - 1) * safePageSize;

        const { cart, totalItems } = await this.cartRepository.findByUserId(
          userId,
          offset,
          safePageSize
        );
        if (!cart) {
          this.logger.warn(`cart not found for user ${userId}`, {
            ctx: GetCartByUserUseCase.name,
          });
          throw new CartNotFoundException(`Cart not found for user with id ${userId}`);
        }
        span.setAttribute("cart.count", totalItems);

        this.logger.log(`Found ${totalItems} cart item for user ${userId}`, {
          ctx: GetCartByUserUseCase.name,
        });
        return { cart: CartDto.fromDomain(cart), total: totalItems };
      }
    );
  }
}
