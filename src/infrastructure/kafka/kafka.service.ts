import { Injectable } from "@nestjs/common";
import { KafkaClient } from "./kafka.client";
import { PublishOptions } from "./kafka.types";

@Injectable()
export class KafkaService {
  constructor(private readonly kafkaClient: KafkaClient) {}

  async publish<T = any>(data: T, options: PublishOptions): Promise<void> {
    return this.kafkaClient.publish(data, options);
  }

  async emit<T = any>(
    topic: string,
    data: T,
    options?: Partial<PublishOptions>
  ): Promise<void> {
    return this.kafkaClient.publish(data, { topic, ...options });
  }
}
