import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GetWalletTransactionsUseCase } from "./get-wallet-transactions.use-case";
import { GetUserWalletUseCase } from "./get-user-wallet.use-case";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    GetWalletTransactionsUseCase,
    GetUserWalletUseCase,
  ],
  exports: [
    GetWalletTransactionsUseCase,
    GetUserWalletUseCase,
  ],
})
export class WalletModule {}
