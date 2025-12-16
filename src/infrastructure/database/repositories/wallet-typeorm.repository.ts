import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WalletOrmEntity } from "../entities/wallet.orm-entity";
import { WalletTransactionOrmEntity } from "../entities/wallet-transaction.orm-entity";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { RedisService } from "src/infrastructure/redis/redis.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";
import { Wallet, WalletCurrency } from "src/domain/entities/user-wallet.entity";
import { WalletTransaction } from "src/domain/entities/wallet-transaction.entiy";

@Injectable()
export default class WalletTypeOrmRepositoryImpl implements IWalletRepository {
  constructor(
    @InjectRepository(WalletOrmEntity)
    private readonly repo: Repository<WalletOrmEntity>,
    @InjectRepository(WalletTransactionOrmEntity)
    private readonly transactionRepo: Repository<WalletTransactionOrmEntity>,
    private readonly cache: RedisService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
    private readonly metrics: MetricsService
  ) {}

  async save(wallet: Wallet): Promise<Wallet> {
    return this.tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.save",
      async (span) => {
        span.setAttribute("db.operation", "insert");
        span.setAttribute("wallet.userId", wallet.userId);
        this.logger.debug(`Saving wallet for userId: ${wallet.userId}`);

        const ormWallet = this.mapToPersistenceEntity(wallet);
        try {
          const resultWallet = await this.repo.save(ormWallet);
          this.logger.debug(`Wallet created with ID: ${resultWallet.id}`);

          await this.cache.set(
            this.getCacheKey(resultWallet.id),
            resultWallet,
            3600
          );

          span.setAttribute("Wallet.created", true);

          return this.mapToDomain(resultWallet, []);
        } catch (err) {
          this.logger.warn(
            `Failed to create wallet for userId: ${wallet.userId}`,
            { error: err }
          );
          span.setAttribute("Wallet.created", false);
          throw err;
        }
      }
    );
  }

  async findById(
    walletId: string,
    offset = 0,
    limit = 10
  ): Promise<{
    wallet: Wallet | null;
    totalTransactions: number;
  }> {
    return this.tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.findById",
      async (span) => {
        span.setAttribute("db.operation", "select");
        span.setAttribute("wallet.id", walletId);

        this.logger.debug(`Searching wallet in cache, walletId: ${walletId}`);

        const cacheKey = this.getCacheKey(walletId);
        const cachedWallet = await this.cache.get<WalletOrmEntity>(cacheKey);

        let wallet: WalletOrmEntity | null = null;
        if (cachedWallet) {
          this.logger.debug(`Cache hit for walletId: ${walletId}`);
          span.setAttribute("cache.hit", true);
          wallet = cachedWallet;
        } else {
          this.logger.debug(`Cache miss for walletId: ${walletId}`);
          span.setAttribute("cache.hit", false);

          const endTimer = this.metrics.measureDBOperationDuration(
            "findById",
            "SELECT"
          );
          this.metrics.incrementDBRequestCounter("SELECT");

          wallet = await this.repo.findOne({ where: { id: walletId } });

          endTimer();

          if (wallet) {
            await this.cache.set(cacheKey, wallet, 3600);
            this.logger.debug(`Wallet found with ID: ${walletId}`);
            span.setAttribute("Wallet.found", true);
          } else {
            this.logger.debug(`Wallet not found with ID: ${walletId}`);
            span.setAttribute("Wallet.found", false);
            return { wallet: null, totalTransactions: 0 };
          }
        }

        // fetch wallet transactions with pagination and get total count
        const [transactionEntities, totalTransactions] =
          await this.transactionRepo.findAndCount({
            where: { walletId },
            order: { timestamp: "DESC" },
            skip: offset,
            take: limit,
          });

        return {
          wallet: this.mapToDomain(wallet, transactionEntities),
          totalTransactions,
        };
      }
    );
  }
  async findTransactionsByWalletId(
    walletId: string,
    offset: number = 0,
    limit: number = 10
  ): Promise<{ transactions: WalletTransaction[]; totalTransactions: number }> {
    if (!walletId) {
      throw new Error("walletId is required");
    }
    if (offset < 0 || limit <= 0) {
      throw new Error("Invalid pagination parameters");
    }

    const [transactionEntities, totalTransactions] =
      await this.transactionRepo.findAndCount({
        where: { walletId },
        order: { timestamp: "DESC" },
        skip: offset,
        take: limit,
      });

    return {
      transactions: transactionEntities.map((entity) =>
        this.mapTransactionToDomain(entity)
      ),
      totalTransactions,
    };
  }

  async findTransaction(
    transactionId: string
  ): Promise<WalletTransaction | null> {
    return this.tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.findTransaction",
      async (span) => {
        span.setAttribute("db.operation", "select");
        span.setAttribute("transaction.id", transactionId);

        const cacheKey = this.getTransactionCacheKey(transactionId);
        const cachedTransaction =
          await this.cache.get<WalletTransactionOrmEntity>(cacheKey);

        if (cachedTransaction) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(
            `Cache hit for wallet transaction id : ${transactionId}`
          );
          return this.mapTransactionToDomain(cachedTransaction);
        }

        span.setAttribute("cache.hit", false);
        this.logger.debug(
          `Cache miss for wallet  transaction id : ${transactionId}`
        );

        const endTimer = this.metrics.measureDBOperationDuration(
          "findTransaction",
          "SELECT"
        );
        this.metrics.incrementDBRequestCounter("SELECT");

        const transaction = await this.transactionRepo.findOne({
          where: { id: transactionId },
        });
        endTimer();

        if (!transaction) {
          this.logger.debug(
            `transaction not found for  transaction id : ${transactionId}`
          );
          span.setAttribute("transaction.found", false);
          return null;
        }
        await this.cache.set(cacheKey, transaction, 3600);
        span.setAttribute("transaction.found", true);
        this.logger.debug(
          `transaction found for  transaction id : ${transactionId}`
        );
        return this.mapTransactionToDomain(transaction);
      }
    );
  }
  async findTransactionByWalletIdAndOrderId(
    walletId: string,
    orderId: string
  ): Promise<WalletTransaction | null> {
    return this.tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.findTransactionByWalletIdAndOrderId",
      async (span) => {
        span.setAttribute("db.operation", "select");
        span.setAttribute("walletId", walletId);
        span.setAttribute("orderId", orderId);

        const tx = await this.transactionRepo.findOne({
          where: { walletId, relatedOrder: orderId },
        });

        if (!tx) {
          return null;
        }
        
        this.logger.debug(
          `Transaction found for walletId: ${walletId} and orderId: ${orderId}`
        );
        return this.mapTransactionToDomain(tx);
      }
    );
  }

  async addTransaction(transaction: WalletTransaction): Promise<void> {
    if (!transaction) {
      throw new Error("transaction is required");
    }
    // Validate required transaction properties if necessary
    try {
      const transactionEntity = this.mapTransactionToPersistence(transaction);
      await this.transactionRepo.save(transactionEntity);
      // Optionally invalidate or update transaction-related cache if implemented
      this.logger.debug(
        `Transaction added with id: ${transaction.id} for wallet: ${transaction.walletId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to add transaction for walletId: ${transaction.walletId}. Error: ${error.message}`
      );
      throw error;
    }
  }

  async findByUserId(
    userId: string,
    offset = 0,
    limit = 10
  ): Promise<{
    wallet: Wallet | null;
    // transactions: WalletTransaction[];
    totalTransactions: number;
  }> {
    return this.tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.findByUserId",
      async (span) => {
        span.setAttribute("db.operation", "select");
        span.setAttribute("wallet.userId", userId);

        const cacheKey = this.getOwnerCacheKey(userId);
        const cached = await this.cache.get<WalletOrmEntity>(cacheKey);

        let wallet: WalletOrmEntity | null = null;
        if (cached) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for wallet userId: ${userId}`);
          wallet = cached;
        } else {
          span.setAttribute("cache.hit", false);
          this.logger.debug(`Cache miss for wallet userId: ${userId}`);

          const endTimer = this.metrics.measureDBOperationDuration(
            "findByUserId",
            "SELECT"
          );
          this.metrics.incrementDBRequestCounter("SELECT");
          wallet = await this.repo.findOne({ where: { userId } });
          endTimer();

          if (wallet) {
            await this.cache.set(cacheKey, wallet, 3600);
            span.setAttribute("Wallet.found", true);
            this.logger.debug(`Wallet found for userId: ${userId}`);
          } else {
            this.logger.debug(`Wallet not found for userId: ${userId}`);
            span.setAttribute("Wallet.found", false);
            return { wallet: null, totalTransactions: 0 };
          }
        }

        // fetch wallet transactions with pagination and get total count
        const [transactionEntities, totalTransactions] =
          await this.transactionRepo.findAndCount({
            where: { walletId: wallet.id },
            order: { timestamp: "DESC" },
            skip: offset,
            take: limit,
          });

        return {
          wallet: this.mapToDomain(wallet, transactionEntities),
          totalTransactions,
        };
      }
    );
  }

  async update(wallet: Wallet): Promise<void> {
    return this.tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.update",
      async (span) => {
        span.setAttribute("db.operation", "update");
        span.setAttribute("wallet.id", wallet.id);

        const existing = await this.repo.findOne({ where: { id: wallet.id } });
        if (!existing) {
          this.logger.warn(`Wallet not found for update: ${wallet.id}`);
          span.setAttribute("Wallet.updated", false);
          return;
        }

        const updateData = this.mapPartialDomainToPartialEntity(wallet);

        const endTimer = this.metrics.measureDBOperationDuration(
          "update",
          "UPDATE"
        );
        this.metrics.incrementDBRequestCounter("UPDATE");

        await this.repo.update({ id: wallet.id }, updateData);

        endTimer();

        const updated = await this.repo.findOne({ where: { id: wallet.id } });

        if (updated) {
          await this.cache.set(this.getCacheKey(wallet.id), updated, 3600);
          if (updated.userId)
            await this.cache.set(
              this.getOwnerCacheKey(updated.userId),
              updated,
              3600
            );
          span.setAttribute("Wallet.updated", true);
          this.logger.debug(`Wallet updated successfully for id: ${wallet.id}`);
        } else {
          span.setAttribute("Wallet.updated", false);
          this.logger.warn(
            `Unknown error after update, wallet not found: ${wallet.id}`
          );
        }
      }
    );
  }

  async delete(wallet: Wallet): Promise<void> {
    return this.tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.delete",
      async (span) => {
        span.setAttribute("db.operation", "delete");
        span.setAttribute("wallet.id", wallet.id);

        const foundWallet = await this.repo.findOne({
          where: { id: wallet.id },
        });
        if (!foundWallet) {
          this.logger.warn(`Wallet not found for delete: ${wallet.id}`);
          span.setAttribute("Wallet.deleted", false);
          return;
        }

        const endTimer = this.metrics.measureDBOperationDuration(
          "delete",
          "DELETE"
        );
        this.metrics.incrementDBRequestCounter("DELETE");

        await this.repo.delete({ id: wallet.id });
        endTimer();

        // Remove from cache by walletId and userId
        await Promise.all([
          this.cache.del(this.getCacheKey(wallet.id)),
          this.cache.del(this.getOwnerCacheKey(wallet.userId)),
        ]);

        span.setAttribute("Wallet.deleted", true);
        this.logger.debug(`Wallet deleted for id: ${wallet.id}`);
      }
    );
  }

  async findAll(offset = 0, limit = 10): Promise<Wallet[]> {
    return this.tracer.startActiveSpan(
      "WalletTypeOrmRepositoryImpl.findAll",
      async (span) => {
        span.setAttribute("db.operation", "select");
        span.setAttribute("query.limit", limit);
        span.setAttribute("query.offset", offset);

        const cacheKey = this.getAllCacheKey(offset, limit);

        const cached = await this.cache.get<WalletOrmEntity[]>(cacheKey);
        if (cached) {
          span.setAttribute("cache.hit", true);
          // No transaction joins here for bulk listing, could be provided if needed.
          return cached.map((wallet) => this.mapToDomain(wallet, []));
        }
        span.setAttribute("cache.hit", false);

        const endTimer = this.metrics.measureDBOperationDuration(
          "findAll",
          "SELECT"
        );
        this.metrics.incrementDBRequestCounter("SELECT");

        const wallets = await this.repo.find({
          skip: offset,
          take: limit,
          order: { createdAt: "DESC" },
        });

        endTimer();

        await this.cache.set(cacheKey, wallets, 300); // shorter TTL for paged list

        return wallets.map((wallet) => this.mapToDomain(wallet, []));
      }
    );
  }

  // ============ Mapping methods (entity <-> domain) ============

  private mapToDomain(
    wallet: WalletOrmEntity,
    transactions: WalletTransactionOrmEntity[]
  ): Wallet {
    if (!wallet) return null;
    // We allow passing already mapped WalletTransaction[] for transactions
    // let txs: WalletTransaction[];
    // if (
    //   transactions.length > 0 &&
    //   transactions[0] instanceof WalletTransaction
    // ) {
    //   txs = transactions as WalletTransaction[];
    // } else {
    const txs = transactions.map((tx) => this.mapTransactionToDomain(tx));
    // }
    return Wallet.fromPrimitives({
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency as WalletCurrency,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      transactions: txs,
    });
  }

  private mapToPersistenceEntity(wallet: Wallet): WalletOrmEntity {
    const orm = new WalletOrmEntity();
    orm.id = wallet.id;
    orm.userId = wallet.userId;
    orm.balance = wallet.balance;
    orm.currency = wallet.currency;
    orm.createdAt = wallet.createdAt;
    orm.updatedAt = wallet.updatedAt;
    return orm;
  }

  private mapTransactionToDomain(
    tx: WalletTransactionOrmEntity
  ): WalletTransaction {
    if (!tx) return null;
    return WalletTransaction.fromPrimitives({
      id: tx.id,
      walletId: tx.walletId,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      timestamp: tx.timestamp,
      note: tx.note,
      relatedOrder: tx.relatedOrder,
    });
  }

  private mapTransactionToPersistence(
    tx: WalletTransaction
  ): WalletTransactionOrmEntity {
    if (!tx) return null;
    const ormEntity = new WalletTransactionOrmEntity();
    ormEntity.id = tx.id;
    ormEntity.walletId = tx.walletId;
    ormEntity.type = tx.type;
    ormEntity.amount = tx.amount;
    ormEntity.status = tx.status;
    ormEntity.timestamp = tx.timestamp;
    ormEntity.note = tx.note;
    ormEntity.relatedOrder = tx.relatedOrder;
  }

  private mapPartialDomainToPartialEntity(
    payload: Partial<Wallet>
  ): Partial<WalletOrmEntity> {
    // Only map allowed updatable fields
    const partial: Partial<WalletOrmEntity> = {};
    if ("balance" in payload) partial.balance = payload.balance;
    if ("currency" in payload) partial.currency = payload.currency;
    if ("updatedAt" in payload) partial.updatedAt = payload.updatedAt;
    // etc: whitelist updatable fields
    return partial;
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
