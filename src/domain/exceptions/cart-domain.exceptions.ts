import { DomainException } from "./base.exception";

export class CartItemNotFoundException extends DomainException {
  errorCode: string = "CART_ITEM_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || `Cart item  not found`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class CartNotFoundException extends DomainException {
  errorCode: string = "CART_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || `Cart not found with id`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class CartItemAlreadyExistException extends DomainException {
  errorCode: string = "CART_ITEM_ALREADY_EXIST_EXCEPTION";
  constructor(message?: string) {
    super(message || `Cart item already present in cart`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
