export abstract class DomainException extends Error {
  abstract errorCode: string;
  constructor(message: string) {
    super(message);
    this.name = "DOMAIN_EXCEPTION";
  }
  abstract serializeError(): { message: string; field?: string }[];
}

export class UserNotFoundException extends DomainException {
  errorCode: string = "USER_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || `User with  not found`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class UserAlreadyExistException extends DomainException {
  errorCode: string = "USER_ALREADY_EXIST_EXCEPTION";
  constructor(message?: string) {
    super(message || `user with email already exist`);
  }
  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class UserDomainException extends DomainException {
  errorCode: string = "USER_DOMAIN_EXCEPTION";
  constructor(message: string) {
    super(message);
  }
  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}

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
export class WishlistItemAlreadyExistException extends DomainException {
  errorCode: string = "WISHLIST_ITEM_ALREADY_EXIST_EXCEPTION";
  constructor(message?: string) {
    super(message || `item already present in user's wishlist`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }]; 
  }
}
export class ClientServiceException extends DomainException {
  errorCode: string = "CLIENT_SERVICE_EXCEPTION";
  constructor(message?: string) {
    super(message || `Something went wrong while executing the client request`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}

export class TimeoutException extends DomainException {
  errorCode: string = 'TIMEOUT_EXCEPTION';
  constructor(message?: string) {
    super(message || `Timeout exception`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
