import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  MicroserviceOptions,
  Transport,
  // TcpStatus,
} from "@nestjs/microservices";
import { ValidationPipe } from "@nestjs/common";
import { GrpcExceptionFilter } from "./infrastructure/filters/grpc-exception.filter";
import { GrpcInterceptor } from "./infrastructure/interceptors/grpc-logging.interceptor";
import { AppConfigService } from "./infrastructure/config/config.service";
import path from "path";
import { getProtoPath, PROTO_ROOT_DIR } from "@edulearn/core";
import { ILoggerService } from "./application/adaptors/logger.service";
import { IMetricService } from "./application/adaptors/metric.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(ILoggerService);
  const config = app.get(AppConfigService);

  // Set Global logger
  app.useLogger(logger);

  // Enable gRPC
  const gRPCServer = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "user_service",
      url: `0.0.0.0:${config.grpcPort}`,

      protoPath: [path.join(getProtoPath("user"))],
      loader: {
        includeDirs: [path.join(PROTO_ROOT_DIR, "user")],
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
    }),
  );

  app.useGlobalFilters(new GrpcExceptionFilter(logger));
  app.useGlobalInterceptors(
    new GrpcInterceptor(logger, app.get(IMetricService)),
  );
  // app.useGlobalGuards(new GrpcAuthGuard(logger));

  // Start both gRPC and HTTP
  await app.startAllMicroservices();
  await app.listen(config.httPort || 3002);
  logger.info(
    `User service started on (http port ${config.httPort}) (grpc port ${config.grpcPort})`,
    { ctx: "Bootstrap" },
  );
}
bootstrap();
