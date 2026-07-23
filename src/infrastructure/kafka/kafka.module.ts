import { Module, Global } from "@nestjs/common";
import { IEventPublisher } from "src/application/adaptors/event-producer";
import { KafkaPublisher } from "./kafka.producer";
import { AppConfigService } from "../config/config.service";
import { KafkaHealthService } from "./kafka-heath.service";
import { CustomKafkaModule } from "./module/kafka.module";

@Global()
@Module({
  imports: [
    CustomKafkaModule.forRootAsync({
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
        // schemaRegistry: {
        //   host: "http://localhost:8081",
        //   auth: {
        //     username: "schema-registry-user",
        //     password: "password",
        //   },
        // },
      }),
      inject: [AppConfigService],
    }),
  ],
  providers: [
    { provide: IEventPublisher, useClass: KafkaPublisher },
    KafkaHealthService,
  ],
  exports: [IEventPublisher, KafkaHealthService],
})
export class KafkaModule {}
