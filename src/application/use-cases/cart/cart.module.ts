import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { AddToCartUseCase } from "./add-to-cart.use-case";
import { RemoveFromCartUseCase } from "./remove-cart.use-case";
import { GetCartByUserUseCase } from "./get-cart-by-user.use-case";
import { ToggleCartUseCase } from "./toggle-cart.use-case";
import { GrpcClientsModule } from "src/infrastructure/grpc/clients/grpc-clients.module";
import { ClearCartUseCase } from "./clear-cart.use-case";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule, GrpcClientsModule],
  providers: [
    AddToCartUseCase,
    ClearCartUseCase,
    RemoveFromCartUseCase,
    GetCartByUserUseCase,
    ToggleCartUseCase,
  ],
  exports: [
    AddToCartUseCase,
    ClearCartUseCase,
    RemoveFromCartUseCase,
    GetCartByUserUseCase,
    ToggleCartUseCase,
  ],
})
export class CartModule {}
