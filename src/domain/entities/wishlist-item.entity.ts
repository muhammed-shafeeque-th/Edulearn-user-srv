
import { v4 as uuidV4 } from "uuid";

export interface WishlistItemProps {
  id: string;
  courseId: string;
  wishlistId: string;
  addedAt: Date;
}

/**
 * Domain entity for WishlistItem.
 * Follows pattern from CartItem/Domain entities—immutable outwardly, factory statics, encapsulated data.
 */
export class WishlistItem {
  private readonly _id: string;
  private readonly _courseId: string;
  private readonly _wishlistId: string;
  private readonly _addedAt: Date;

  // Private constructor for full control
  private constructor(props: WishlistItemProps) {
    this._id = props.id;
    this._courseId = props.courseId;
    this._wishlistId = props.wishlistId;
    this._addedAt = new Date(props.addedAt);
  }

  /**
   * Create a new wishlist item (generates UUID and timestamp).
   */
  static create(
    props: Omit<WishlistItemProps, "id" | "addedAt">
  ): WishlistItem {
    return new WishlistItem({
      ...props,
      id: uuidV4(),
      addedAt: new Date(),
    });
  }

  /**
   * Load/rehydrate a wishlist item from persistence/primitives.
   */
  static fromPrimitives(props: WishlistItemProps): WishlistItem {
    return new WishlistItem(props);
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get courseId(): string {
    return this._courseId;
  }

  get wishlistId(): string {
    return this._wishlistId;
  }

  get addedAt(): Date {
    return this._addedAt;
  }

  /**
   * For persistence or serialization.
   */
  toPrimitives(): WishlistItemProps {
    return {
      id: this._id,
      courseId: this._courseId,
      wishlistId: this._wishlistId,
      addedAt: new Date(this._addedAt),
    };
  }
}

