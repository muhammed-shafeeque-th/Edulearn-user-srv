import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

export class CartItemNotFoundException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.NOT_FOUND,
      message || `Cart item  not found`,
      "CART_ITEM_NOT_FOUND",
    );
  }
}
export class CartNotFoundException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.NOT_FOUND,
      message || `Cart not found for id`,
      "CART_NOT_FOUND",
    );
  }
}

export class CartItemAlreadyExistException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.ALREADY_EXISTS,
      message || `Cart item already present in cart`,
      "CART_ITEM_ALREADY_EXIST",
    );
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
