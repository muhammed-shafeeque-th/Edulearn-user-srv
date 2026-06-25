import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { AppConfigService } from "../config/config.service";
import { redisStore } from "cache-manager-redis-store";
import { RedisService } from "./redis.service";
import { IEventProcessRepository } from "src/domain/repositories/event-process-repository.interface";
import { EventProcessRepositoryImpl } from "./event-process.repository";
import { ICacheService } from "src/application/adaptors/cache.service";

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async (configService: AppConfigService) => ({
        store: await redisStore({ url: configService.redisUrl, ttl: 3600 }),
      }),
      inject: [AppConfigService],
    }),
  ],
  providers: [
    { provide: IEventProcessRepository, useClass: EventProcessRepositoryImpl },
    { provide: ICacheService, useClass: RedisService },
  ],
  exports: [ICacheService, IEventProcessRepository],
})
export class RedisModule {}
