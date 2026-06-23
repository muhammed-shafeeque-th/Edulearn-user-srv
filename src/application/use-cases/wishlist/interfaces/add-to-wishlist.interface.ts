import { WishlistItemDto } from "src/application/dtos/wishlist.dto";

export abstract class IAddToWishlistUseCase {
  abstract execute(userId: string, courseId: string): Promise<WishlistItemDto>;
}
