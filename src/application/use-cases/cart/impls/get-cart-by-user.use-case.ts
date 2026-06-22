import { Injectable } from "@nestjs/common";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { CartDto } from "src/application/dtos/cart.dto";
import { CartNotFoundException } from "src/domain/exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { IGetCartByUserUseCase } from "../interfaces/get-cart-by-user.interface";

@Injectable()
export class GetCartByUserUseCase implements IGetCartByUserUseCase {
  constructor(
    private readonly _cartRepository: ICartRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ cart: CartDto | null; total: number }> {
    return await this._tracer.startActiveSpan(
      "GetCartByUserUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
        });
        this._logger.log(`Fetching cart for user ${userId}`, {
          ctx: GetCartByUserUseCase.name,
        });
        // Page should be >= 1, fallback if not
        const safePage = Math.max(Number(page) || 1, 1);
        const safePageSize = Math.max(Number(limit) || 10, 1);

        // Offset is (page - 1) * limit
        const offset = (safePage - 1) * safePageSize;

        const { cart, totalItems } = await this._cartRepository.findByUserId(
          userId,
          offset,
          safePageSize,
        );
        if (!cart) {
          this._logger.warn(`cart not found for user ${userId}`, {
            ctx: GetCartByUserUseCase.name,
          });
          throw new CartNotFoundException(
            `Cart not found for user with id ${userId}`,
          );
        }
        span.setAttribute("cart.count", totalItems);

        this._logger.log(`Found ${totalItems} cart item for user ${userId}`, {
          ctx: GetCartByUserUseCase.name,
        });
        return { cart: CartDto.fromDomain(cart), total: totalItems };
      },
    );
  }
}
