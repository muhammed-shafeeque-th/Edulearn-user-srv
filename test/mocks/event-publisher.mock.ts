import { IEventPublisher } from "@/application/adaptors/event-producer";

export function createMockEventPublisher(): jest.Mocked<IEventPublisher> {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
    emit: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IEventPublisher>;
}
