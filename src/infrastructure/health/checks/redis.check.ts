import { Injectable } from "@nestjs/common";
import {
  HealthCheckResult,
  BaseHealthCheck,
  HealthRegistry,
} from "@edulearn/nest";
import { ICacheService } from "@application/adaptors/cache.service";

@Injectable()
export class RedisHealthCheck extends BaseHealthCheck {
  readonly name = "redis";

  constructor(
    registry: HealthRegistry,
    private readonly cache: ICacheService,
  ) {
    super(registry);
  }
  async check(): Promise<HealthCheckResult> {
    try {
      await this.cache.ping();
      return {
        name: "redis",
        status: "up",
      };
    } catch (error: any) {
      return {
        name: "redis",
        status: "down",
        message: error?.message ?? "unknown",
      };
    }
  }
}
