import { Module } from "@nestjs/common";
import { UserGrpcController } from "./user-grpc.controller";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";

// import { GrpcInfrastructureModule } from "src/infrastructure/grpc/grpc.module";
import { CartGrpcController } from "./cart-grpc.controller";
import { WishlistGrpcController } from "./wishlist-grpc.controller";
import { UserModule } from "src/application/use-cases/user/user.module";
import { WishlistModule } from "src/application/use-cases/wishlist/wishlist.module";
import { WalletModule } from "src/application/use-cases/wallet/wallet.module";
import { CartModule } from "src/application/use-cases/cart/cart.module";
import { WalletGrpcController } from "./wallet-grpc.controller";

@Module({
  imports: [
    // DatabaseRepositoryModule,
    KafkaModule,

    UserModule,
    CartModule,
    WalletModule,
    WishlistModule,

    // GrpcInfrastructureModule,
  ],
  controllers: [UserGrpcController, CartGrpcController, WishlistGrpcController, WalletGrpcController],
})
export class GrpcPresentationModule {}
