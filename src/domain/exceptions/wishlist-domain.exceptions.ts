import { DomainException } from "./base.exception";

export class WishlistItemNotFoundException extends DomainException {
  errorCode: string = "WISHLIST_ITEM_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || `Wishlist item  not found`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class WishlistNotFoundException extends DomainException {
  errorCode: string = "WISHLIST_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || `Wishlist not found with id`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class WishlistItemAlreadyExistException extends DomainException {
  errorCode: string = "WISHLIST_ITEM_ALREADY_EXIST_EXCEPTION";
  constructor(message?: string) {
    super(message || `item already present in user's wishlist`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
