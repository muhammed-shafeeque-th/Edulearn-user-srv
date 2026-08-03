import { Module } from "@nestjs/common";
import { AppHealthModule } from "@infrastructure/health/health.module";
import { AppMetricsModule } from "@infrastructure/observability/metrics/metrics.module";
import { AppLoggerModule } from "@infrastructure/observability/logging/logging.module";
import { AppTracerModule } from "@infrastructure/observability/tracing/tracing.module";

import { GrpcPresentationModule } from "./presentation/grpc/grpc.module";
import { ConfigModule } from "./infrastructure/config/config.module";
import { KafkaPresentationModule } from "./presentation/kafka/kafka.module";

@Module({
  imports: [
    ConfigModule,

    AppTracerModule,
    AppLoggerModule,
    AppMetricsModule,

    AppHealthModule,

    GrpcPresentationModule,
    KafkaPresentationModule,
  ],
})
export class AppModule {}
