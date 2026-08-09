import { WishlistItem } from "src/domain/entities/wishlist-item.entity";

export abstract class IAddToWishlistUseCase {
  abstract execute(userId: string, courseId: string): Promise<WishlistItem>;
}
