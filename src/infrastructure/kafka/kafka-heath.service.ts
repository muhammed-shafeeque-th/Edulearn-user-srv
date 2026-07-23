import { Injectable } from "@nestjs/common";
import { KafkaClient } from "./module/kafka.client";

@Injectable()
export class KafkaHealthService {
  constructor(private readonly client: KafkaClient) {}

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}
