import { ErrorCode } from "src/shared/exceptions/error-codes";
import { DomainException } from "./domain.exception";
import { status as GrpcStatus, ServiceError } from "@grpc/grpc-js";

export class UserNotFoundException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.NOT_FOUND,
      message || `User with  not found`,
      "USER_NOT_FOUND",
    );
  }
}
export class UserAlreadyExistException extends DomainException {
  constructor(message?: string) {
    super(
      ErrorCode.ALREADY_EXISTS,
      message || `user with email already exist`,
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
