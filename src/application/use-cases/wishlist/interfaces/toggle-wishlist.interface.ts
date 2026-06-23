import { WishlistItemDto } from "@/application/dtos/wishlist.dto";

export abstract class IToggleWishlistUseCase {
  abstract execute(userId: string, courseId: string): Promise<WishlistItemDto>;
}
