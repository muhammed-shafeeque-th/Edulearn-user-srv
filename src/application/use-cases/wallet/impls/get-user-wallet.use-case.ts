import { Injectable, NotFoundException } from "@nestjs/common";
import { WalletDto } from "src/application/dtos/wallet.dto";
import { UserWalletNotFoundException } from "src/domain/exceptions";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IGetUserWalletUseCase } from "../interfaces/get-user-wallet.interface";

@Injectable()
export class GetUserWalletUseCase implements IGetUserWalletUseCase {
  constructor(
    private readonly _walletRepository: IWalletRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ wallet: WalletDto; total: number }> {
    return this._tracer.startActiveSpan(
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

          this._logger.debug(
            `Fetching wallet for userId=${userId}, page=${page}, limit=${limit}`,
            { ctx: GetUserWalletUseCase.name },
          );

          const { wallet: userWallet, totalTransactions } =
            await this._walletRepository.findByUserId(userId, offset, limit);

          if (!userWallet) {
            this._logger.warn(`Wallet not found for userId=${userId}`, {
              ctx: GetUserWalletUseCase.name,
            });
            throw new UserWalletNotFoundException(
              `Wallet associated with user ${userId} not found`,
            );
          }

          this._logger.debug(
            `Successfully retrieved wallet for userId=${userId}`,
            { ctx: GetUserWalletUseCase.name },
          );

          return {
            wallet: WalletDto.fromDomain(userWallet),
            total: totalTransactions,
          };
        } catch (err: any) {
          this._logger.error(
            `Failed to get wallet for user: ${userId}. Reason: ${err?.message}`,
            { ctx: GetUserWalletUseCase.name, error: err },
          );
          throw err;
        }
      },
    );
  }
}
