import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from "@nestjs/common";
import { status } from "@grpc/grpc-js";
import { RpcException } from "@nestjs/microservices";
import { ILoggerService } from "src/application/adaptors/logger.service";

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  constructor(private readonly _logger: ILoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToRpc();
    const _metadata = ctx.getContext();

    let statusCode = status.INTERNAL;
    let message = "Internal server error";

    // Handle validation errors
    if (exception instanceof BadRequestException) {
      statusCode = status.INVALID_ARGUMENT;
      const response = exception.getResponse();
      message =
        typeof response === "string"
          ? response
          : (response as any).message.join(", ");
    } else if (exception instanceof RpcException) {
      const error = exception.getError();
      if (typeof error === "object" && "code" in error && "message" in error) {
        statusCode = (error as any).message;
      } else {
        message = message.toString();
      }
    } else {
      this._logger.error(`Unexpected error: ${exception.message}`, {
        ...exception,
        ctx: GrpcExceptionFilter.name,
      });
      message = exception.message || "Internal server error";
    }
    throw new RpcException({
      code: statusCode,
      message,
    });
  }
}
