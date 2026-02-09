import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfigService } from "../config/config.service";
import { UserOrmEntity } from "./entities/user.orm-entity";
import { CartOrmEntity } from "./entities/cart.orm-entity";
import { WishlistOrmEntity } from "./entities/wishlist.orm-entity";
import { WishlistItemOrmEntity } from "./entities/wishlist-item.orm-entity";
import { CartItemOrmEntity } from "./entities/cart-item.orm-entity";
import { InstructorProfileOrmEntity } from "./entities/instructor-profile.orm-entity";
import { UserSocialOrmEntity } from "./entities/socials.orm-entity";
import { UserProfileOrmEntity } from "./entities/user-profile-orm.entiry";
import { UserConnectionOrmEntity } from "./entities/connection-orm-entity";
import { InstructorReviewOrmEntity } from "./entities/instructor.review-orm.entity";
import { WalletOrmEntity } from "./entities/wallet.orm-entity";
import { WalletTransactionOrmEntity } from "./entities/wallet-transaction.orm-entity";
import { InstructorStudentOrmEntity } from "./entities/instructor-student.orm-entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: AppConfigService) => ({
        type: "postgres",
        host: configService.databaseHost,
        port: Number(configService.databasePort),
        username: configService.databaseUsername,
        password: configService.databasePassword,
        database: configService.databaseName,
        autoLoadEntities: true, // Auto load entities registered with @Entity()
        synchronize: configService.nodeEnv !== "production", // Auto schema sync (dev only!)
        // synchronize: false, // Auto schema sync (dev only!)
        logging: configService.nodeEnv !== "production" && ["error"], // Auto schema sync (dev only!)
        extra: {
          max: 50, // Maximum number of connections
          min: 5, // Minimum number of connections to keep alive
          idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
          connectionTimeoutMillis: 15000, // Timeout for acquiring a connection
        },
      }),
      inject: [AppConfigService],
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      InstructorProfileOrmEntity,
      InstructorReviewOrmEntity,
      UserSocialOrmEntity,
      UserProfileOrmEntity,
      InstructorStudentOrmEntity,
      UserConnectionOrmEntity,
      CartOrmEntity,
      WalletOrmEntity,
      WalletTransactionOrmEntity,
      CartItemOrmEntity,
      WishlistOrmEntity,
      WishlistItemOrmEntity,
    ]),
  ],
  providers: [
    UserOrmEntity,
    InstructorProfileOrmEntity,
    InstructorReviewOrmEntity,
    UserSocialOrmEntity,
    UserProfileOrmEntity,
    InstructorStudentOrmEntity,
    UserConnectionOrmEntity,
    CartOrmEntity,
    WalletOrmEntity,
    WalletTransactionOrmEntity,
    CartItemOrmEntity,
    WishlistOrmEntity,
    WishlistItemOrmEntity,
  ],
  exports: [
    UserOrmEntity,
    InstructorProfileOrmEntity,
    InstructorReviewOrmEntity,
    UserSocialOrmEntity,
    InstructorStudentOrmEntity,
    UserProfileOrmEntity,
    UserConnectionOrmEntity,
    TypeOrmModule,
    CartOrmEntity,
    WalletOrmEntity,
    WalletTransactionOrmEntity,
    CartItemOrmEntity,
    WishlistOrmEntity,
    WishlistItemOrmEntity,
  ],
})
export class DatabaseEntityModule {}
