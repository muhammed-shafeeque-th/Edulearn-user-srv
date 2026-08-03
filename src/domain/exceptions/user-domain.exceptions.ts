import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";

export class UserNotFoundException extends DomainException {
  constructor(userId?: string) {
    super(
      ErrorCode.NOT_FOUND,
      `User ${userId} not found ` || `User not found`,
      "USER_NOT_FOUND",
    );
  }
}
export class UserAlreadyExistException extends DomainException {
  constructor(email?: string) {
    super(
      ErrorCode.ALREADY_EXISTS,
      `user with email ${email} already exist`,
      "USER_ALREADY_EXIST",
    );
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class UserDomainException extends DomainException {
  constructor(message: string) {
    super(ErrorCode.NOT_FOUND, message, "USER_DOMAIN_EXCEPTION");
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
