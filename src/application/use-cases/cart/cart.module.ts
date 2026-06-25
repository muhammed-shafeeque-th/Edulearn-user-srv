import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GrpcClientsModule } from "src/infrastructure/grpc/clients/grpc-clients.module";
import { IAddToCartUseCase } from "./interfaces/add-to-cart.interface";
import { AddToCartUseCase } from "./impls/add-to-cart.use-case";
import { ClearCartUseCase } from "./impls/clear-cart.use-case";
import { RemoveFromCartUseCase } from "./impls/remove-cart.use-case";
import { GetCartByUserUseCase } from "./impls/get-cart-by-user.use-case";
import { ToggleCartUseCase } from "./impls/toggle-cart.use-case";
import { IToggleCartUseCase } from "./interfaces/toggle-cart.interface";
import { IGetCartByUserUseCase } from "./interfaces/get-cart-by-user.interface";
import { IRemoveFromCartUseCase } from "./interfaces/remove-cart.interface";
import { IClearCartUseCase } from "./interfaces/clear-cart.interface";

@Module({
  imports: [
    DatabaseRepositoryModule,
    RedisModule,
    KafkaModule,
    GrpcClientsModule,
  ],
  providers: [
    { provide: IAddToCartUseCase, useClass: AddToCartUseCase },
    { provide: IClearCartUseCase, useClass: ClearCartUseCase },
    { provide: IRemoveFromCartUseCase, useClass: RemoveFromCartUseCase },
    { provide: IGetCartByUserUseCase, useClass: GetCartByUserUseCase },
    { provide: IToggleCartUseCase, useClass: ToggleCartUseCase },
  ],
  exports: [
    IAddToCartUseCase,
    IClearCartUseCase,
    IRemoveFromCartUseCase,
    IGetCartByUserUseCase,
    IToggleCartUseCase,
  ],
})
export class CartModule {}
