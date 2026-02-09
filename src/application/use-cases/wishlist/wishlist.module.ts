import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { AddToWishlistUseCase } from "./add-to-wishlist.use-case";
import { RemoveFromWishlistUseCase } from "./remove-wishlist.use-case";
import { GetWishlistByUserUseCase } from "./get-wishlist-by-user.use-case";
import { ToggleWishlistUseCase } from "./toggle-wishlist.use-case";
import { GrpcClientsModule } from "src/infrastructure/grpc/clients/grpc-clients.module";

@Module({
  imports: [
    DatabaseRepositoryModule,
    RedisModule,
    KafkaModule,
    GrpcClientsModule,
  ],
  providers: [
    AddToWishlistUseCase,
    RemoveFromWishlistUseCase,
    GetWishlistByUserUseCase,
    ToggleWishlistUseCase,
  ],
  exports: [
    AddToWishlistUseCase,
    RemoveFromWishlistUseCase,
    GetWishlistByUserUseCase,
    ToggleWishlistUseCase,
  ],
})
export class WishlistModule {}
