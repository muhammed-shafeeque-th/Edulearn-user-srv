import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { Wishlist } from "src/domain/entities/wishlist.entity";
import { WishlistItem } from "src/domain/entities/wishlist-item.entity";
import { WishlistOrmEntity } from "../entities/wishlist.orm-entity";
import { WishlistItemOrmEntity } from "../entities/wishlist-item.orm-entity";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { EntityMapper } from "../mapper/entity-mapper";
import { IMetricService } from "src/application/adaptors/metric.service";

@Injectable()
export class WishlistTypeOrmRepository implements IWishlistRepository {
  constructor(
    @InjectRepository(WishlistOrmEntity)
    private readonly repo: Repository<WishlistOrmEntity>,
    @InjectRepository(WishlistItemOrmEntity)
    private readonly wishlistItemRepo: Repository<WishlistItemOrmEntity>,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
    private readonly metrics: IMetricService,
  ) {}

  async create(wishlist: Wishlist): Promise<void> {
    return await this._tracer.startActiveSpan(
      "WishlistTypeOrmRepository.create",
      async (span) => {
        span.setAttributes({
          "db.operation": "INSERT",
          "wishlist.id": wishlist.id,
        });
        const ormEntity = EntityMapper.toOrmWishlist(wishlist);

        this.metrics.incrementDBRequestCounter("INSERT");

        const end = this.metrics.measureDBOperationDuration(
          "wishlist.create",
          "INSERT",
        );
        await this.repo.save(ormEntity);

        if (wishlist.items.length > 0) {
          const wishlistItemEntities = wishlist.items.map((item) =>
            EntityMapper.toOrmWishlistItem(item),
          );
          await this.wishlistItemRepo.save(wishlistItemEntities);
        }

        end();
      },
    );
  }

  async findById(id: string): Promise<Wishlist | null> {
    return await this._tracer.startActiveSpan(
      "WishlistTypeOrmRepository.findById",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "wishlist.id": id,
        });

        this.metrics.incrementDBRequestCounter("SELECT");

        const end = this.metrics.measureDBOperationDuration(
          "wishlist.findById",
          "SELECT",
        );
        const ormEntity = await this.repo.findOne({
          where: { id },
          relations: ["items"],
        });
        end();

        if (!ormEntity) {
          span.setAttribute("wishlist.db.found", false);
          return null;
        }

        span.setAttribute("wishlist.db.found", true);
        const wishlist = EntityMapper.toDomainWishlist(ormEntity);
        return wishlist;
      },
    );
  }
  async findItemByUserIdAndCourseId(
    userId: string,
    courseId: string,
  ): Promise<WishlistItem | null> {
    return await this._tracer.startActiveSpan(
      "WishlistTypeOrmRepository.findItemByUserIdAndCourseId",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "wishlist.userId": userId,
          "wishlist.courseId": courseId,
        });

        const result = await this.findByUserId(userId);
        if (!result.wishlist) {
          span.setAttribute("wishlist.db.found", false);
          return null;
        }

        const wishlistItem = result.wishlist.items.find(
          (item) => item.courseId === courseId,
        );

        if (!wishlistItem) {
          span.setAttribute("wishlist.db.found", false);
          return null;
        }

        span.setAttribute("wishlist.db.found", true);
        return wishlistItem;
      },
    );
  }

  async findByUserId(
    userId: string,
    offset?: number,
    limit?: number,
  ): Promise<{ wishlist: Wishlist | null; totalItems: number }> {
    return await this._tracer.startActiveSpan(
      "WishlistTypeOrmRepository.findByUserId",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "user.id": userId,
        });
        this.metrics.incrementDBRequestCounter("SELECT");

        const end = this.metrics.measureDBOperationDuration(
          "wishlist.findByCourseId",
          "SELECT",
        );

        const wishlistEntity = await this.repo.findOne({
          where: { userId },
        });

        if (!wishlistEntity) {
          span.setAttribute("wishlist.db.found", false);
          return { wishlist: null, totalItems: 0 };
        }

        const totalItems = await this.wishlistItemRepo.count({
          where: { wishlistId: wishlistEntity.id },
        });

        const items = await this.wishlistItemRepo.find({
          where: { wishlistId: wishlistEntity.id },
          skip: offset || 0,
          take: limit || 10,
          order: { addedAt: "DESC" },
        });

        const wishlistWithItems = {
          ...wishlistEntity,
          items: items,
        };

        end();

        span.setAttribute("wishlist.db.found", true);
        const wishlist = EntityMapper.toDomainWishlist(wishlistWithItems);

        return { wishlist, totalItems };
      },
    );
  }

  async delete(wishlist: Wishlist): Promise<void> {
    return await this._tracer.startActiveSpan(
      "WishlistTypeOrmRepository.delete",
      async (span) => {
        span.setAttributes({
          "db.operation": "DELETE",
          "wishlist.id": wishlist.id,
        });

        this.metrics.incrementDBRequestCounter("DELETE");

        const end = this.metrics.measureDBOperationDuration(
          "wishlist.delete",
          "DELETE",
        );

        await this.wishlistItemRepo.delete({ wishlistId: wishlist.id });

        await this.repo.delete(wishlist.id);
        end();
      },
    );
  }

  async update(wishlist: Wishlist): Promise<void> {
    return await this._tracer.startActiveSpan(
      "WishlistTypeOrmRepository.update",
      async (span) => {
        span.setAttributes({
          "db.operation": "UPDATE",
          "wishlist.id": wishlist.id,
        });

        this.metrics.incrementDBRequestCounter("UPDATE");
        const end = this.metrics.measureDBOperationDuration(
          "wishlist.update",
          "UPDATE",
        );

        const ormEntity = EntityMapper.toOrmWishlist(wishlist);
        await this.repo.save(ormEntity);

        if (wishlist.items.length > 0) {
          await this.wishlistItemRepo.delete({ wishlistId: wishlist.id });

          const wishlistItemEntities = wishlist.items.map((item) =>
            EntityMapper.toOrmWishlistItem(item),
          );
          await this.wishlistItemRepo.save(wishlistItemEntities);
        }

        end();

        this._logger.debug(`Updated wishlist ${wishlist.id}`, {
          ctx: WishlistTypeOrmRepository.name,
        });
      },
    );
  }

  async addItem(wishlistItem: WishlistItem): Promise<void> {
    return await this._tracer.startActiveSpan(
      "WishlistTypeOrmRepository.addItem",
      async (span) => {
        span.setAttributes({
          "db.operation": "INSERT",
          "wishlist.id": wishlistItem.wishlistId,
          "course.id": wishlistItem.courseId,
        });

        const wishlistItemOrm = EntityMapper.toOrmWishlistItem(wishlistItem);

        this.metrics.incrementDBRequestCounter("INSERT");
        const end = this.metrics.measureDBOperationDuration(
          "wishlist.addItem",
          "INSERT",
        );

        await this.wishlistItemRepo.save(wishlistItemOrm);
        end();

        this._logger.debug(
          `Added item ${wishlistItem.courseId} to wishlist ${wishlistItem.wishlistId}`,
          {
            ctx: WishlistTypeOrmRepository.name,
          },
        );
      },
    );
  }

  async removeItem(wishlistId: string, courseId: string): Promise<void> {
    return await this._tracer.startActiveSpan(
      "WishlistTypeOrmRepository.removeItem",
      async (span) => {
        span.setAttributes({
          "db.operation": "DELETE",
          "wishlist.id": wishlistId,
          "course.id": courseId,
        });

        this.metrics.incrementDBRequestCounter("DELETE");
        const end = this.metrics.measureDBOperationDuration(
          "wishlist.removeItem",
          "DELETE",
        );

        await this.wishlistItemRepo.delete({ wishlistId, courseId });
        end();

        this._logger.debug(
          `Removed item ${courseId} from wishlist ${wishlistId}`,
          {
            ctx: WishlistTypeOrmRepository.name,
          },
        );
      },
    );
  }
}
