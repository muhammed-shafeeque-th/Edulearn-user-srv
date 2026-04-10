import { DomainException } from "./base.exception";

export class UserWalletNotFoundException extends DomainException {
  errorCode: string = "USER_WALLET_NOT_FOUND_EXCEPTION";
  constructor(message?: string) {
    super(message || `User Wallet  not found`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class UserWalletAlreadyExistException extends DomainException {
  errorCode: string = "USER_WALLET_ALREADY_EXIST_EXCEPTION";
  constructor(message?: string) {
    super(message || `user wallet already exist`);
  }
  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
