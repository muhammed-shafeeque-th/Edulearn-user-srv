import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { LoggingService } from "../observability/logging/logging.service";
import { MetricsService } from "../observability/metrics/metrics.service";
import { finalize, Observable, tap} from "rxjs";
import { Metadata } from "@grpc/grpc-js";
import { context, propagation } from "@opentelemetry/api";

@Injectable()
export class GrpcInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggingService,
    private readonly metrics: MetricsService,
  ) {}

  intercept(
    ctx: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const call = ctx.switchToRpc();
    const metadata: Metadata = call.getContext();
    const method = ctx.getHandler().name;

    //Extract tracing context
    propagation.extract(context.active(), metadata);

    this.logger.debug(`gRPC request received to method ${method}`, {
      ctx: GrpcInterceptor.name,
    });
    const endRequest = this.metrics.measureRequestDuration(method);
    this.metrics.incrementRequestCounter(method);
    const start = Date.now();
    let status = "success";

    return next.handle().pipe(
      tap({
        error: (error) => {
          status = "error";
          this.logger.error(`gRPC method ${method} failed: ${error.message}`, {
            error,
            ctx: GrpcInterceptor.name,
          });
          this.metrics.incrementErrorCounter(method);
        },
      }),
      finalize(() => {
        const duration = (Date.now() - start) / 1000; // Convert to seconds
        endRequest();
        this.logger.debug(
          `gRPC method ${method} completed with status ${status} in ${duration}s`,
          { ctx: GrpcInterceptor.name },
        );
      }),
    );
  }
}
