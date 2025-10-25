import { Injectable } from "@nestjs/common";
import { Cart } from "src/domain/entities/cart.entity";
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
  ): Promise<{ cart: Cart | null; total: number }> {
    return await this.tracer.startActiveSpan(
      "GetCartByUserUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
        });
        this.logger.log(`Fetching cart for user ${userId}`, {
          ctx: GetCartByUserUseCase.name,
        });

        const { cart, totalItems } = await this.cartRepository.findByUserId(
          userId,
          page,
          limit
        );
        span.setAttribute("cart.count", totalItems);

        this.logger.log(`Found ${totalItems} cart item for user ${userId}`, {
          ctx: GetCartByUserUseCase.name,
        });
        return { cart, total: totalItems };
      }
    );
  }
}
