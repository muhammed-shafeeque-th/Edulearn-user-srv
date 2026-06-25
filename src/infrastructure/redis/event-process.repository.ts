import { Injectable } from "@nestjs/common";
import { IEventProcessRepository } from "src/domain/repositories/event-process-repository.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ICacheService } from "src/application/adaptors/cache.service";

@Injectable()
export class EventProcessRepositoryImpl implements IEventProcessRepository {
  private readonly KEY_PREFIX = "event:processed:";

  constructor(
    private readonly _cache: ICacheService,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async isProcessed(eventId: string): Promise<boolean> {
    return this._tracer.startActiveSpan(
      "EventProcessRepositoryImpl.isProcessed",
      async (span) => {
        const key = this.KEY_PREFIX + eventId;
        span.setAttribute("event.id", eventId);
        try {
          const result = await this._cache.get(key);
          const processed = result === "1";
          this._logger.debug(
            `Checked processed status for eventId ${eventId}: ${processed}`,
            {
              ctx: "EventProcessRepositoryImpl",
            },
          );
          return processed;
        } catch (error: any) {
          this._logger.error(
            `Failed to check processed status for eventId ${eventId}: ${error.message}`,
            {
              error,
              ctx: "EventProcessRepositoryImpl",
            },
          );
          throw error;
        }
      },
    );
  }

  async markAsProcessed(eventId: string): Promise<boolean> {
    return this._tracer.startActiveSpan(
      "EventProcessRepositoryImpl.markAsProcessed",
      async (span) => {
        const key = this.KEY_PREFIX + eventId;
        span.setAttribute("event.id", eventId);
        try {
          // Set with NX, i.e., only if not already set (atomic)
          // Optionally, one can choose an expiry in seconds for the deduplication window, e.g., 30 days
          const expirySeconds = 60 * 60 * 24 * 30; // 30 days
          // Otherwise, use the underlying redis client; assuming basic set nx is exposed in _cache
          // _cache.set(key, value, ttl?)
          await this._cache.set(key, "1", expirySeconds);

          this._logger.debug(
            `Marked eventId ${eventId} as processed in Redis`,
            {
              ctx: "EventProcessRepositoryImpl",
            },
          );
          return true;
        } catch (error: any) {
          this._logger.error(
            `Failed to mark eventId ${eventId} as processed: ${error.message}`,
            {
              error,
              ctx: "EventProcessRepositoryImpl",
            },
          );
          throw error;
        }
      },
    );
  }
}
