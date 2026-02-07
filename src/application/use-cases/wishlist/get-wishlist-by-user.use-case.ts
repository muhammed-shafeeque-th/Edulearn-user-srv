import { Injectable } from "@nestjs/common";
import { WishlistDto } from "src/application/dtos/wishlist.dto";
import { WishlistNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetWishlistByUserUseCase {
  constructor(
    private readonly wishlistRepository: IWishlistRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  /**
   * Retrieves the wishlist for a user, paginated.
   * @param userId User identifier.
   * @param page Page number (1-indexed).
   * @param pageSize Number of items per page.
   */
  async execute(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<{ wishlist: WishlistDto; total: number }> {
    return await this.tracer.startActiveSpan(
      "GetWishlistByUserUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
        });

        this.logger.log(`Fetching wishlist for user ${userId}`, {
          ctx: GetWishlistByUserUseCase.name,
        });

        // Page should be >= 1, fallback if not
        const safePage = Math.max(Number(page) || 1, 1);
        const safePageSize = Math.max(Number(pageSize) || 10, 1);

        // Offset is (page - 1) * pageSize
        const offset = (safePage - 1) * safePageSize;

        const { wishlist, totalItems } =
          await this.wishlistRepository.findByUserId(
            userId,
            offset,
            safePageSize
          );
        if (!wishlist) {
          this.logger.warn(`Wishlist not found for user ${userId}`, {
            ctx: GetWishlistByUserUseCase.name,
          });
          throw new WishlistNotFoundException(`Wishlist not found for user with id ${userId}`);
        }

        span.setAttribute("wishlist.count", totalItems);

        this.logger.log(
          `Found ${totalItems} wishlist items for user ${userId} (page=${safePage}, pageSize=${safePageSize})`,
          {
            ctx: GetWishlistByUserUseCase.name,
          }
        );

        return {
          wishlist: WishlistDto.fromDomain(wishlist),
          total: totalItems,
        };
      }
    );
  }
}
