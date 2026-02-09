export abstract class DomainException extends Error {
  abstract errorCode: string;
  constructor(message: string) {
    super(message);
    this.name = "DOMAIN_EXCEPTION";
  }
  abstract serializeError(): { message: string; field?: string }[];
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
