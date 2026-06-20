import { WishlistItem } from "@/domain/entities/wishlist-item.entity";
import { Wishlist } from "@/domain/entities/wishlist.entity";
import { FAKE_COURSE_ID, FAKE_USER_ID } from "./constants";

export function createMockWishlist(userId = FAKE_USER_ID): Wishlist {
  return Wishlist.create({ userId });
}

export function createMockWishlistItem(
  wishlistId: string,
  courseId = FAKE_COURSE_ID,
): WishlistItem {
  return WishlistItem.create({ courseId, wishlistId });
}
