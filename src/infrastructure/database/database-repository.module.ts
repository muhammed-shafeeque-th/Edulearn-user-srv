import { Module } from "@nestjs/common";
import { DatabaseEntityModule } from "./database-entity.module";
import { RedisModule } from "../redis/redis.module";
import { KafkaModule } from "../kafka/kafka.module";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { WishlistTypeOrmRepository } from "./repositories/wishlist-typeorm.repository";
import { CartTypeOrmRepository } from "./repositories/cart-typeorm.repository";
import UserTypeOrmRepositoryImpl from "./repositories/user-typeorm.repository";
import WalletTypeOrmRepositoryImpl from "./repositories/wallet-typeorm.repository";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { IInstructorStudentRepository } from "src/domain/repositories/instructor-student.repository";
import { TypeOrmInstructorStudentRepository } from "./repositories/instructor-student-typeorm.repository";

@Module({
  imports: [DatabaseEntityModule, RedisModule, KafkaModule],
  providers: [
    { provide: IUserRepository, useClass: UserTypeOrmRepositoryImpl },
    { provide: IWishlistRepository, useClass: WishlistTypeOrmRepository },
    {
      provide: IInstructorStudentRepository,
      useClass: TypeOrmInstructorStudentRepository,
    },
    { provide: IWalletRepository, useClass: WalletTypeOrmRepositoryImpl },
    { provide: ICartRepository, useClass: CartTypeOrmRepository },
  ],
  exports: [
    DatabaseEntityModule,
    IUserRepository,
    IWalletRepository,
    IWishlistRepository,
    ICartRepository,
    IInstructorStudentRepository,
  ],
})
export class DatabaseRepositoryModule {}
