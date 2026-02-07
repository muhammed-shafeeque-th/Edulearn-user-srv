import { WishlistItem } from "src/domain/entities/wishlist-item.entity";
import { Wishlist } from "src/domain/entities/wishlist.entity";
import {
  WishlistData,
  WishlistItemData,
} from "src/infrastructure/grpc/generated/user/types/wishlist_types";

export class WishlistItemDto {
  id: string;
  courseId: string;
  addedAt: Date;

  static fromDomain(wishlistItem: WishlistItem) {
    const dto = new WishlistItemDto();
    dto.addedAt = wishlistItem.addedAt;
    dto.courseId = wishlistItem.courseId;
    dto.id = wishlistItem.id;

    return dto;
  }

  public toGrpcResponse(): WishlistItemData {
    return {
      courseId: this.courseId,
      createdAt: this.addedAt.toISOString(),
      id: this.id,
    };
  }
}

export class WishlistDto {
  id: string;
  userId: string;
  courseId: string;
  total: number;
  items: WishlistItemDto[];
  comment: string;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(wishlist: Wishlist): WishlistDto {
    const dto = new WishlistDto();
    dto.id = wishlist.id;
    dto.userId = wishlist.userId;
    dto.createdAt = wishlist.createdAt;
    dto.updatedAt = wishlist.updatedAt;
    dto.items = wishlist.items.map(WishlistItemDto.fromDomain);

    return dto;
  }

  public toGrpcResponse(): WishlistData {
    return {
      createdAt: this.createdAt.toISOString(),
      id: this.id,
      items: this.items.map((item) => item.toGrpcResponse()),
      total: this.total,
      updatedAt: this.updatedAt.toISOString(),
      userId: this.userId,
    };
  }
}
