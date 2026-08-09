import { WishlistItem } from "src/domain/entities/wishlist-item.entity";
import { Wishlist } from "src/domain/entities/wishlist.entity";
import {
  WishlistData,
  WishlistItemData,
} from "src/infrastructure/grpc/generated/user/types/wishlist_types";

export class WishlistItemMapper {
  static toGrpcResponse(item: WishlistItem): WishlistItemData {
    return {
      courseId: item.courseId,
      createdAt: item.addedAt.toISOString(),
      id: item.id,
    };
  }
}

export class WishlistMapper {
  static toGrpcResponse(wishlist: Wishlist): WishlistData {
    return {
      createdAt: wishlist.createdAt.toISOString(),
      id: wishlist.id,
      items: wishlist.items.map((item) =>
        WishlistItemMapper.toGrpcResponse(item),
      ),
      total: wishlist.total,
      updatedAt: wishlist.updatedAt.toISOString(),
      userId: wishlist.userId,
    };
  }
}
