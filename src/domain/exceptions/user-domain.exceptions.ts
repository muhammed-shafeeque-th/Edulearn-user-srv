import { DomainException } from "./base.exception";

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
