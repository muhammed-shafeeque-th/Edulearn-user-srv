import { WishlistDto } from "src/application/dtos/wishlist.dto";

export abstract class IGetWishlistByUserUseCase {
  /**
   * Retrieves the wishlist for a user, paginated.
   * @param userId User identifier.
   * @param page Page number (1-indexed).
   * @param pageSize Number of items per page.
   */
  abstract execute(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ wishlist: WishlistDto; total: number }>;
}
