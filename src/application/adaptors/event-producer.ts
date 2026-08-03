import { PublishOptions } from "@/infrastructure/kafka/module/kafka.types";

export abstract class IEventPublisher {
  abstract publish<T = any>(data: T, options: PublishOptions): Promise<void>;

  abstract emit<T = any>(
    topic: string,
    data: T,
    options?: Partial<PublishOptions>,
  ): Promise<void>;
}
