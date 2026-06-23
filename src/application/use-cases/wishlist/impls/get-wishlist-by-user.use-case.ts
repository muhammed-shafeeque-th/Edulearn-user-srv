import { Injectable } from "@nestjs/common";
import { WishlistDto } from "@/application/dtos/wishlist.dto";
import { WishlistNotFoundException } from "src/domain/exceptions";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IGetWishlistByUserUseCase } from "../interfaces/get-wishlist-by-user.interface";

@Injectable()
export class GetWishlistByUserUseCase implements IGetWishlistByUserUseCase {
  constructor(
    private readonly _wishlistRepository: IWishlistRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ wishlist: WishlistDto; total: number }> {
    return await this._tracer.startActiveSpan(
      "GetWishlistByUserUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
        });

        this._logger.log(`Fetching wishlist for user ${userId}`, {
          ctx: GetWishlistByUserUseCase.name,
        });

        // Page should be >= 1, fallback if not
        const safePage = Math.max(Number(page) || 1, 1);
        const safePageSize = Math.max(Number(pageSize) || 10, 1);

        const offset = (safePage - 1) * safePageSize;

        const { wishlist, totalItems } =
          await this._wishlistRepository.findByUserId(
            userId,
            offset,
            safePageSize,
          );
        if (!wishlist) {
          this._logger.warn(`Wishlist not found for user ${userId}`, {
            ctx: GetWishlistByUserUseCase.name,
          });
          throw new WishlistNotFoundException(
            `Wishlist not found for user with id ${userId}`,
          );
        }

        span.setAttribute("wishlist.count", totalItems);

        this._logger.log(
          `Found ${totalItems} wishlist items for user ${userId} (page=${safePage}, pageSize=${safePageSize})`,
          {
            ctx: GetWishlistByUserUseCase.name,
          },
        );

        return {
          wishlist: WishlistDto.fromDomain(wishlist),
          total: totalItems,
        };
      },
    );
  }
}
