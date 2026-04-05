import { Injectable, NotFoundException } from "@nestjs/common";
import { WalletDto } from "src/application/dtos/wallet.dto";
import { UserWalletNotFoundException } from "src/domain/exceptions";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetUserWalletUseCase {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  /**
   * Retrieve the wallet of a user, along with transaction total.
   * @param userId user identifier
   * @param page pagination page number (1-based)
   * @param limit number of transactions per page
   */
  async execute(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<{ wallet: WalletDto; total: number }> {
    return this.tracer.startActiveSpan(
      "GetUserWalletUseCase.execute",
      async (span) => {
        try {
          if (page < 1) page = 1;
          if (limit < 1) limit = 10;

          const offset = (page - 1) * limit;

          span.setAttributes({
            "user.id": userId,
            page: page,
            limit: limit,
          });

          this.logger.debug(
            `Fetching wallet for userId=${userId}, page=${page}, limit=${limit}`,
            { ctx: GetUserWalletUseCase.name }
          );

          const { wallet: userWallet, totalTransactions } =
            await this.walletRepository.findByUserId(userId, offset, limit);

          if (!userWallet) {
            this.logger.warn(`Wallet not found for userId=${userId}`, {
              ctx: GetUserWalletUseCase.name,
            });
            throw new UserWalletNotFoundException(
              `Wallet associated with user ${userId} not found`
            );
          }

          this.logger.debug(
            `Successfully retrieved wallet for userId=${userId}`,
            { ctx: GetUserWalletUseCase.name }
          );

          return {
            wallet: WalletDto.fromDomain(userWallet),
            total: totalTransactions,
          };
        } catch (err) {
          span.recordException?.(err);
          this.logger.error(
            `Failed to get wallet for user: ${userId}. Reason: ${err?.message}`,
            { ctx: GetUserWalletUseCase.name, error: err }
          );
          throw err;
        }
      }
    );
  }
}
