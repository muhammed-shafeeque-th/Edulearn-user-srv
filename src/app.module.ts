import { Module } from "@nestjs/common";
import { LoggingModule } from "./infrastructure/observability/logging/logging.module";
import { TracingModule } from "./infrastructure/observability/tracing/tracing.module";
import { MetricsModule } from "./infrastructure/observability/metrics/metrics.module";
import { GrpcPresentationModule } from "./presentation/grpc/grpc.module";
import { HttpModule } from "./presentation/http/http.module";
import { ConfigModule } from "./infrastructure/config/config.module";
import { KafkaModule } from "./infrastructure/kafka/kafka.module";
import { AppConfigService } from "./infrastructure/config/config.service";
import { KafkaPresentationModule } from "./presentation/kafka/kafka.module";

@Module({
  imports: [
    ConfigModule,

    LoggingModule,
    TracingModule,
    MetricsModule,

    KafkaModule.forRootAsync({
      useFactory: async (config: AppConfigService) => ({
        clientId: config.kafkaClientId || "my-app",
        brokers: config.kafkaBrokers || ["localhost:9092"],
        consumer: {
          groupId: config.kafkaConsumerGroup || "user-consumer-group",
          sessionTimeout: 30000,
          heartbeatInterval: 3000,
          maxBytesPerPartition: config.kafkaFetchMaxBytes || 1048576,
          retry: {
            retries: 5,
          },
        },
        producer: {
          maxInFlightRequests: 1,
          idempotent: true,
          retry: {
            retries: 5,
          },
        },
        schemaRegistry: {
          host: "http://localhost:8081",
          auth: {
            username: "schema-registry-user",
            password: "password",
          },
        },
      }),
      inject: [AppConfigService],
    }),

    GrpcPresentationModule,
    HttpModule,
    KafkaPresentationModule,
  ],
})
export class AppModule {}
