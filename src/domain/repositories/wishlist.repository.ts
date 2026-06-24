import { WishlistItem } from "../entities/wishlist-item.entity";
import { Wishlist } from "../entities/wishlist.entity";

export abstract class IWishlistRepository {
  abstract create(wishlist: Wishlist): Promise<void>;
  abstract delete(wishlist: Wishlist): Promise<void>;
  abstract findById(id: string): Promise<Wishlist | null>;
  abstract findItemByUserIdAndCourseId(
    userId: string,
    courseId: string,
  ): Promise<WishlistItem | null>;
  abstract findByUserId(
    userId: string,
    offset?: number,
    limit?: number,
  ): Promise<{ wishlist: Wishlist | null; totalItems: number }>;
  abstract update(wishlist: Wishlist): Promise<void>;
  abstract addItem(wishlistItem: WishlistItem): Promise<void>;
  abstract removeItem(wishlistId: string, courseId: string): Promise<void>;
}
