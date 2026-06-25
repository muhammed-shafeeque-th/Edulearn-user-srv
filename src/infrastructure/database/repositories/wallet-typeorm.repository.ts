import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WalletOrmEntity } from "../entities/wallet.orm-entity";
import { WalletTransactionOrmEntity } from "../entities/wallet-transaction.orm-entity";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { RedisService } from "src/infrastructure/redis/redis.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { Wallet, WalletCurrency } from "src/domain/entities/user-wallet.entity";
import { WalletTransaction } from "src/domain/entities/wallet-transaction.entiy";
import { EntityMapper } from "../mapper/entity-mapper";
import { IMetricService } from "src/application/adaptors/metric.service";
import { ICacheService } from "src/application/adaptors/cache.service";

@Injectable()
export default class WalletTypeOrmRepositoryImpl implements IWalletRepository {
  constructor(
    @InjectRepository(WalletOrmEntity)
    private readonly repo: Repository<WalletOrmEntity>,
    @InjectRepository(WalletTransactionOrmEntity)
    private readonly _transactionRepo: Repository<WalletTransactionOrmEntity>,
    private readonly _cache: ICacheService,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
    private readonly metrics: IMetricService,
  ) {}

  async save(wallet: Wallet): Promise<Wallet> {
    return await this._tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.save",
      async (span) => {
        span.setAttribute("db.operation", "insert");
        span.setAttribute("wallet.userId", wallet.userId);
        this._logger.debug(`Saving wallet for userId: ${wallet.userId}`);

        const ormWallet = EntityMapper.toOrmWallet(wallet);
        try {
          const resultWallet = await this.repo.save(ormWallet);
          this._logger.debug(`Wallet created with ID: ${resultWallet.id}`);

          await this._cache.set(
            this.getCacheKey(resultWallet.id),
            resultWallet,
            3600,
          );

          span.setAttribute("Wallet.created", true);

          return EntityMapper.toDomainWallet(resultWallet, []);
        } catch (err) {
          this._logger.warn(
            `Failed to create wallet for userId: ${wallet.userId}`,
            { error: err },
          );
          span.setAttribute("Wallet.created", false);
          throw err;
        }
      },
    );
  }

  async findById(
    walletId: string,
    offset = 0,
    limit = 10,
  ): Promise<{
    wallet: Wallet | null;
    totalTransactions: number;
  }> {
    return await this._tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.findById",
      async (span) => {
        span.setAttribute("db.operation", "select");
        span.setAttribute("wallet.id", walletId);

        this._logger.debug(`Searching wallet in cache, walletId: ${walletId}`);

        const cacheKey = this.getCacheKey(walletId);
        const cachedWallet = await this._cache.get<WalletOrmEntity>(cacheKey);

        let wallet: WalletOrmEntity | null = null;
        if (cachedWallet) {
          this._logger.debug(`Cache hit for walletId: ${walletId}`);
          span.setAttribute("cache.hit", true);
          wallet = cachedWallet;
        } else {
          this._logger.debug(`Cache miss for walletId: ${walletId}`);
          span.setAttribute("cache.hit", false);

          const endTimer = this.metrics.measureDBOperationDuration(
            "findById",
            "SELECT",
          );
          this.metrics.incrementDBRequestCounter("SELECT");

          wallet = await this.repo.findOne({ where: { id: walletId } });

          endTimer();

          if (wallet) {
            await this._cache.set(cacheKey, wallet, 3600);
            this._logger.debug(`Wallet found with ID: ${walletId}`);
            span.setAttribute("Wallet.found", true);
          } else {
            this._logger.debug(`Wallet not found with ID: ${walletId}`);
            span.setAttribute("Wallet.found", false);
            return { wallet: null, totalTransactions: 0 };
          }
        }

        // fetch wallet transactions with pagination and get total count
        const [transactionEntities, totalTransactions] =
          await this._transactionRepo.findAndCount({
            where: { walletId },
            order: { timestamp: "DESC" },
            skip: offset,
            take: limit,
          });

        return {
          wallet: EntityMapper.toDomainWallet(wallet, transactionEntities),
          totalTransactions,
        };
      },
    );
  }
  async findTransactionsByWalletId(
    walletId: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<{ transactions: WalletTransaction[]; totalTransactions: number }> {
    if (!walletId) {
      throw new Error("walletId is required");
    }
    if (offset < 0 || limit <= 0) {
      throw new Error("Invalid pagination parameters");
    }

    const [transactionEntities, totalTransactions] =
      await this._transactionRepo.findAndCount({
        where: { walletId },
        order: { timestamp: "DESC" },
        skip: offset,
        take: limit,
      });

    return {
      transactions: transactionEntities.map((entity) =>
        EntityMapper.toDomainWalletTransaction(entity),
      ),
      totalTransactions,
    };
  }

  async findTransaction(
    transactionId: string,
  ): Promise<WalletTransaction | null> {
    return await this._tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.findTransaction",
      async (span) => {
        span.setAttribute("db.operation", "select");
        span.setAttribute("transaction.id", transactionId);

        const cacheKey = this.getTransactionCacheKey(transactionId);
        const cachedTransaction =
          await this._cache.get<WalletTransactionOrmEntity>(cacheKey);

        if (cachedTransaction) {
          span.setAttribute("cache.hit", true);
          this._logger.debug(
            `Cache hit for wallet transaction id : ${transactionId}`,
          );
          return EntityMapper.toDomainWalletTransaction(cachedTransaction);
        }

        span.setAttribute("cache.hit", false);
        this._logger.debug(
          `Cache miss for wallet  transaction id : ${transactionId}`,
        );

        const endTimer = this.metrics.measureDBOperationDuration(
          "findTransaction",
          "SELECT",
        );
        this.metrics.incrementDBRequestCounter("SELECT");

        const transaction = await this._transactionRepo.findOne({
          where: { id: transactionId },
        });
        endTimer();

        if (!transaction) {
          this._logger.debug(
            `transaction not found for  transaction id : ${transactionId}`,
          );
          span.setAttribute("transaction.found", false);
          return null;
        }
        await this._cache.set(cacheKey, transaction, 3600);
        span.setAttribute("transaction.found", true);
        this._logger.debug(
          `transaction found for  transaction id : ${transactionId}`,
        );
        return EntityMapper.toDomainWalletTransaction(transaction);
      },
    );
  }
  async findTransactionByWalletIdAndOrderId(
    walletId: string,
    orderId: string,
  ): Promise<WalletTransaction | null> {
    return await this._tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.findTransactionByWalletIdAndOrderId",
      async (span) => {
        span.setAttribute("db.operation", "select");
        span.setAttribute("walletId", walletId);
        span.setAttribute("orderId", orderId);

        const tx = await this._transactionRepo.findOne({
          where: { walletId, relatedOrder: orderId },
        });

        if (!tx) {
          return null;
        }

        this._logger.debug(
          `Transaction found for walletId: ${walletId} and orderId: ${orderId}`,
        );
        return EntityMapper.toDomainWalletTransaction(tx);
      },
    );
  }

  async addTransaction(transaction: WalletTransaction): Promise<void> {
    if (!transaction) {
      throw new Error("transaction is required");
    }
    // Validate required transaction properties if necessary
    try {
      const transactionEntity =
        EntityMapper.toOrmWalletTransaction(transaction);
      await this._transactionRepo.save(transactionEntity);
      // Optionally invalidate or update transaction-related cache if implemented
      this._logger.debug(
        `Transaction added with id: ${transaction.id} for wallet: ${transaction.walletId}`,
      );
    } catch (error: any) {
      this._logger.error(
        `Failed to add transaction for walletId: ${transaction.walletId}. Error: ${error.message}`,
      );
      throw error;
    }
  }

  async findByUserId(
    userId: string,
    offset = 0,
    limit = 10,
  ): Promise<{
    wallet: Wallet | null;
    // transactions: WalletTransaction[];
    totalTransactions: number;
  }> {
    return await this._tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.findByUserId",
      async (span) => {
        span.setAttribute("db.operation", "select");
        span.setAttribute("wallet.userId", userId);

        const cacheKey = this.getOwnerCacheKey(userId);
        const cached = await this._cache.get<WalletOrmEntity>(cacheKey);

        let wallet: WalletOrmEntity | null = null;
        if (cached) {
          span.setAttribute("cache.hit", true);
          this._logger.debug(`Cache hit for wallet userId: ${userId}`);
          wallet = cached;
        } else {
          span.setAttribute("cache.hit", false);
          this._logger.debug(`Cache miss for wallet userId: ${userId}`);

          const endTimer = this.metrics.measureDBOperationDuration(
            "findByUserId",
            "SELECT",
          );
          this.metrics.incrementDBRequestCounter("SELECT");
          wallet = await this.repo.findOne({ where: { userId } });
          endTimer();

          if (wallet) {
            await this._cache.set(cacheKey, wallet, 3600);
            span.setAttribute("Wallet.found", true);
            this._logger.debug(`Wallet found for userId: ${userId}`);
          } else {
            this._logger.debug(`Wallet not found for userId: ${userId}`);
            span.setAttribute("Wallet.found", false);
            return { wallet: null, totalTransactions: 0 };
          }
        }

        // fetch wallet transactions with pagination and get total count
        const [transactionEntities, totalTransactions] =
          await this._transactionRepo.findAndCount({
            where: { walletId: wallet.id },
            order: { timestamp: "DESC" },
            skip: offset,
            take: limit,
          });

        return {
          wallet: EntityMapper.toDomainWallet(wallet, transactionEntities),
          totalTransactions,
        };
      },
    );
  }

  async update(wallet: Wallet): Promise<void> {
    return await this._tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.update",
      async (span) => {
        span.setAttribute("db.operation", "update");
        span.setAttribute("wallet.id", wallet.id);

        const existing = await this.repo.findOne({ where: { id: wallet.id } });
        if (!existing) {
          this._logger.warn(`Wallet not found for update: ${wallet.id}`);
          span.setAttribute("Wallet.updated", false);
          return;
        }

        const updateData = EntityMapper.toPartialOrmWallet(wallet);

        const endTimer = this.metrics.measureDBOperationDuration(
          "update",
          "UPDATE",
        );
        this.metrics.incrementDBRequestCounter("UPDATE");

        await this.repo.update({ id: wallet.id }, updateData);

        endTimer();

        const updated = await this.repo.findOne({ where: { id: wallet.id } });

        if (updated) {
          await this._cache.set(this.getCacheKey(wallet.id), updated, 3600);
          if (updated.userId)
            await this._cache.set(
              this.getOwnerCacheKey(updated.userId),
              updated,
              3600,
            );
          span.setAttribute("Wallet.updated", true);
          this._logger.debug(
            `Wallet updated successfully for id: ${wallet.id}`,
          );
        } else {
          span.setAttribute("Wallet.updated", false);
          this._logger.warn(
            `Unknown error after update, wallet not found: ${wallet.id}`,
          );
        }
      },
    );
  }

  async delete(wallet: Wallet): Promise<void> {
    return await this._tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.delete",
      async (span) => {
        span.setAttribute("db.operation", "delete");
        span.setAttribute("wallet.id", wallet.id);

        const foundWallet = await this.repo.findOne({
          where: { id: wallet.id },
        });
        if (!foundWallet) {
          this._logger.warn(`Wallet not found for delete: ${wallet.id}`);
          span.setAttribute("Wallet.deleted", false);
          return;
        }

        const endTimer = this.metrics.measureDBOperationDuration(
          "delete",
          "DELETE",
        );
        this.metrics.incrementDBRequestCounter("DELETE");

        await this.repo.delete({ id: wallet.id });
        endTimer();

        // Remove from cache by walletId and userId
        await Promise.all([
          this._cache.del(this.getCacheKey(wallet.id)),
          this._cache.del(this.getOwnerCacheKey(wallet.userId)),
        ]);

        span.setAttribute("Wallet.deleted", true);
        this._logger.debug(`Wallet deleted for id: ${wallet.id}`);
      },
    );
  }

  async findAll(offset = 0, limit = 10): Promise<Wallet[]> {
    return await this._tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.findAll",
      async (span) => {
        span.setAttribute("db.operation", "select");
        span.setAttribute("query.limit", limit);
        span.setAttribute("query.offset", offset);

        const cacheKey = this.getAllCacheKey(offset, limit);

        const cached = await this._cache.get<WalletOrmEntity[]>(cacheKey);
        if (cached) {
          span.setAttribute("cache.hit", true);
          // No transaction joins here for bulk listing, could be provided if needed.
          return cached.map((wallet) =>
            EntityMapper.toDomainWallet(wallet, []),
          );
        }
        span.setAttribute("cache.hit", false);

        const endTimer = this.metrics.measureDBOperationDuration(
          "findAll",
          "SELECT",
        );
        this.metrics.incrementDBRequestCounter("SELECT");

        const wallets = await this.repo.find({
          skip: offset,
          take: limit,
          order: { createdAt: "DESC" },
        });

        endTimer();

        await this._cache.set(cacheKey, wallets, 300); // shorter TTL for paged list

        return wallets.map((wallet) => EntityMapper.toDomainWallet(wallet, []));
      },
    );
  }

  async getRevenueSummery(instructorId: string): Promise<{
    totalEarnings: number;
    thisMonthEarnings: number;
    lastMonthEarnings: number;
    thisWeekEarnings: number;
    todayEarnings: number;
  } | null> {
    return await this._tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.getRevenueSummery",
      async (span) => {
        try {
          // These could be parameterized or changed.
          span.setAttribute("db.operation", "aggregate");
          span.setAttribute("query.target", "wallet_transaction");
          span.setAttribute("wallet.owner_id", instructorId);

          if (!instructorId) {
            this._logger.warn("getRevenueSummery called without instructorId");
            return null;
          }

          // Find the Wallet of instructor
          const wallet = await this.repo.findOne({
            where: { userId: instructorId },
            select: ["id"],
          });

          if (!wallet) {
            this._logger.debug(
              `No wallet found for instructorId: ${instructorId}`,
            );
            return null;
          }

          // We assume 'amount' is the income, and 'createdAt' is the transaction date
          // Optionally, you can filter only successful/settled income, etc.

          // EPOCH filter helpers
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const startOfLastMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1,
          );
          const endOfLastMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59,
            999,
          );
          const startOfWeek = (() => {
            const _d = new Date(now);
            _d.setDate(now.getDate() - now.getDay());
            _d.setHours(0, 0, 0, 0);
            return _d;
          })();
          const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );

          // Compose subquery for summing by range
          const agg = await this._transactionRepo
            .createQueryBuilder("tx")
            .select([
              'COALESCE(SUM(tx.amount),0) as "totalEarnings"',
              `COALESCE(SUM(CASE WHEN tx."timestamp" >= :startOfMonth THEN tx.amount ELSE 0 END),0) as "thisMonthEarnings"`,
              `COALESCE(SUM(CASE WHEN tx."timestamp" >= :startOfLastMonth AND tx."timestamp" <= :endOfLastMonth THEN tx.amount ELSE 0 END),0) as "lastMonthEarnings"`,
              `COALESCE(SUM(CASE WHEN tx."timestamp" >= :startOfWeek THEN tx.amount ELSE 0 END),0) as "thisWeekEarnings"`,
              `COALESCE(SUM(CASE WHEN tx."timestamp" >= :startOfToday THEN tx.amount ELSE 0 END),0) as "todayEarnings"`,
            ])
            .where("tx.walletId = :walletId", { walletId: wallet.id })
            // Optionally only sum INCOME/settled/finished transactions:
            // .andWhere('tx.type = :type', { type: 'INCOME' })
            .setParameters({
              startOfMonth,
              startOfLastMonth,
              endOfLastMonth,
              startOfWeek,
              startOfToday,
            })
            .getRawOne<{
              totalEarnings: string;
              thisMonthEarnings: string;
              lastMonthEarnings: string;
              thisWeekEarnings: string;
              todayEarnings: string;
            }>();

          return {
            totalEarnings: Number(agg.totalEarnings) || 0,
            thisMonthEarnings: Number(agg.thisMonthEarnings) || 0,
            lastMonthEarnings: Number(agg.lastMonthEarnings) || 0,
            thisWeekEarnings: Number(agg.thisWeekEarnings) || 0,
            todayEarnings: Number(agg.todayEarnings) || 0,
          };
        } catch (error: any) {
          this._logger.error(
            `Error getting revenue summary for instructor ${instructorId}: ${error?.message}`,
            {
              error,
              instructorId,
            },
          );
          span?.recordException?.(error as any);
          return null;
        }
      },
    );
  }

  // ============ Cache Key helpers ============

  private getCacheKey(walletId: string): string {
    return `db:wallet:${walletId}`;
  }

  private getOwnerCacheKey(userId: string): string {
    return `db:wallet:owner:${userId}`;
  }
  private getTransactionCacheKey(userId: string): string {
    return `db:wallet:owner:${userId}`;
  }

  private getAllCacheKey(offset: number, limit: number): string {
    return `db:wallets:offset:${offset}:limit:${limit}`;
  }
}
