import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { LoggingService } from "./infrastructure/observability/logging/logging.service";
import {
  MicroserviceOptions,
  Transport,
  TcpStatus,
} from "@nestjs/microservices";
import { ValidationPipe } from "@nestjs/common";
import { GrpcExceptionFilter } from "./infrastructure/filters/grpc-exeption.filter";
import { GrpcInterceptor } from "./infrastructure/interceptors/grpc-logging.interceptor";
import { GrpcAuthGuard } from "./infrastructure/guards/grpc-auth.guard";
import { AppConfigService } from "./infrastructure/config/config.service";
import { MetricsService } from "./infrastructure/observability/metrics/metrics.service";
import path from "path";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggingService);
  const config = app.get(AppConfigService);

  // Set Global logger
  app.useLogger(logger);

  // Enable gRPC
  const gRPCServer = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "user_service",
      protoPath: path.join(
       process.cwd(),
        "proto",
        "user_service.proto"
      ),
      url: `0.0.0.0:${config.grpcPort}`,
      loader: {
        includeDirs: [path.join(process.cwd(), "proto")],
      },
    },
  });

  // gRPCServer.status.subscribe((status: TcpStatus) => {
  //   console.log("server status: " + status);
  // });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties not defined in DTOs
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      errorHttpStatusCode: 400, // Map validation errors to BAD_REQUEST
    })
  );

  app.useGlobalFilters(new GrpcExceptionFilter(logger));
  app.useGlobalInterceptors(
    new GrpcInterceptor(logger, app.get(MetricsService))
  );
  // app.useGlobalGuards(new GrpcAuthGuard(logger));

  // Start both gRPC and HTTP
  await app.startAllMicroservices();
  await app.listen(config.apiPort || 3002);
  logger.info(
    `User service started on (http port ${config.apiPort}) (grpc port ${config.grpcPort})`,
    { ctx: "Bootstrap" }
  );
}
bootstrap();
