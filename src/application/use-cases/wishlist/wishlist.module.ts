import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { AddToWishlistUseCase } from "./impls/add-to-wishlist.use-case";
import { RemoveFromWishlistUseCase } from "./impls/remove-wishlist.use-case";
import { GetWishlistByUserUseCase } from "./impls/get-wishlist-by-user.use-case";
import { ToggleWishlistUseCase } from "./impls/toggle-wishlist.use-case";
import { GrpcClientsModule } from "src/infrastructure/grpc/clients/grpc-clients.module";
import { IAddToWishlistUseCase } from "./interfaces/add-to-wishlist.interface";
import { IRemoveFromWishlistUseCase } from "./interfaces/remove-wishlist.interface";
import { IGetWishlistByUserUseCase } from "./interfaces/get-wishlist-by-user.interface";
import { IToggleWishlistUseCase } from "./interfaces/toggle-wishlist.interface";

@Module({
  imports: [
    DatabaseRepositoryModule,
    RedisModule,
    KafkaModule,
    GrpcClientsModule,
  ],
  providers: [
    { provide: IAddToWishlistUseCase, useClass: AddToWishlistUseCase },
    {
      provide: IRemoveFromWishlistUseCase,
      useClass: RemoveFromWishlistUseCase,
    },
    { provide: IGetWishlistByUserUseCase, useClass: GetWishlistByUserUseCase },
    { provide: IToggleWishlistUseCase, useClass: ToggleWishlistUseCase },
  ],
  exports: [
    IAddToWishlistUseCase,
    IRemoveFromWishlistUseCase,
    IGetWishlistByUserUseCase,
    IToggleWishlistUseCase,
  ],
})
export class WishlistModule {}
