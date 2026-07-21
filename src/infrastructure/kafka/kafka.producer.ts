import { Injectable } from "@nestjs/common";
import { KafkaClient } from "./module/kafka.client";
import { PublishOptions } from "./module/kafka.types";
import { IEventPublisher } from "src/application/adaptors/event-producer";

@Injectable()
export class KafkaPublisher implements IEventPublisher {
  constructor(private readonly kafkaClient: KafkaClient) {}

  async publish<T = any>(data: T, options: PublishOptions): Promise<void> {
    return this.kafkaClient.publish(data, options);
  }

  async emit<T = any>(
    topic: string,
    data: T,
    options?: Partial<PublishOptions>,
  ): Promise<void> {
    return this.kafkaClient.publish(data, { topic, ...options });
  }
}
