import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";
import { status as GrpcStatus, ServiceError } from "@grpc/grpc-js";

export class WishlistItemNotFoundException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.NOT_FOUND,
      message || `Wishlist item  not found`,
      "WISHLIST_ITEM_NOT_FOUND",
    );
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class WishlistNotFoundException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.NOT_FOUND,
      message || `Wishlist not found with id`,
      "WISHLIST_NOT_FOUND",
    );
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class WishlistItemAlreadyExistException extends DomainException {
  errorCode: string = "WISHLIST_ITEM_ALREADY_EXIST_EXCEPTION";
  constructor(message?: string) {
    super(
      ErrorCode.ALREADY_EXISTS,
      message || `item already present in user's wishlist`,
      "WISHLIST_ITEM_ALREADY_EXIST",
    );
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
