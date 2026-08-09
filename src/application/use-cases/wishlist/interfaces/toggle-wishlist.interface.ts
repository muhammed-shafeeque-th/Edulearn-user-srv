import { WishlistItem } from "src/domain/entities/wishlist-item.entity";

export abstract class IToggleWishlistUseCase {
  abstract execute(userId: string, courseId: string): Promise<WishlistItem>;
}
