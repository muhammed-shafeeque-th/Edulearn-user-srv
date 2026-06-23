import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GetWalletTransactionsUseCase } from "./impls/get-wallet-transactions.use-case";
import { GetUserWalletUseCase } from "./impls/get-user-wallet.use-case";
import { GetInstructorRevenueSummeryUseCase } from "./impls/get-instructor-revenue-summery.use-case";
import { IGetWalletTransactionsUseCase } from "./interfaces/get-wallet-transactions.interface";
import { IGetUserWalletUseCase } from "./interfaces/get-user-wallet.interface";
import { IGetInstructorRevenueSummeryUseCase } from "./interfaces/get-instructor-revenue-summery.interface";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    {
      provide: IGetWalletTransactionsUseCase,
      useClass: GetWalletTransactionsUseCase,
    },
    { provide: IGetUserWalletUseCase, useClass: GetUserWalletUseCase },
    {
      provide: IGetInstructorRevenueSummeryUseCase,
      useClass: GetInstructorRevenueSummeryUseCase,
    },
  ],
  exports: [
    IGetWalletTransactionsUseCase,
    IGetUserWalletUseCase,
    IGetInstructorRevenueSummeryUseCase,
  ],
})
export class WalletModule {}
