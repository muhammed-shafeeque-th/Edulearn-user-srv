import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

export class UserWalletNotFoundException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.NOT_FOUND, message || `User Wallet  not found`, 'USER_WALLET_NOT_FOUND');
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class UserWalletAlreadyExistException extends DomainException {
  constructor(message?: string) {
    super(ErrorCode.ALREADY_EXISTS, message || `user wallet already exist`, 'USER_WALLET_ALREADY_EXIST');
  }

  
  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
