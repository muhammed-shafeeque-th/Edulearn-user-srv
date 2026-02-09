import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RedisService } from "../../redis/redis.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";

import { ICartRepository } from "src/domain/repositories/cart.repository";
import { CartOrmEntity } from "../entities/cart.orm-entity";
import { CartItemOrmEntity } from "../entities/cart-item.orm-entity";
import { Cart } from "src/domain/entities/cart.entity";
import { CartItem } from "src/domain/entities/cart-item.entity";
import { EntityMapper } from "../mapper/entity-mapper";

@Injectable()
export class CartTypeOrmRepository implements ICartRepository {
  constructor(
    @InjectRepository(CartOrmEntity)
    private readonly repo: Repository<CartOrmEntity>,
    @InjectRepository(CartItemOrmEntity)
    private readonly cartItemRepo: Repository<CartItemOrmEntity>,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
    private readonly metrics: MetricsService,
  ) {}

  async create(cart: Cart): Promise<void> {
    return await this.tracer.startActiveSpan(
      "CartTypeOrmRepository.create",
      async (span) => {
        span.setAttributes({
          "db.operation": "INSERT",
          "cart.id": cart.id,
        });
        const ormEntity = EntityMapper.toOrmCart(cart);

        this.metrics.incrementDBRequestCounter("INSERT");

        const end = this.metrics.measureDBOperationDuration(
          "cart.create",
          "INSERT",
        );
        await this.repo.save(ormEntity);

        if (cart.items.length > 0) {
          const cartItemEntities = cart.items.map((item) =>
            EntityMapper.toOrmCartItem(item),
          );
          await this.cartItemRepo.save(cartItemEntities);
        }

        end();
      },
    );
  }

  async findById(id: string): Promise<Cart | null> {
    return await this.tracer.startActiveSpan(
      "CartTypeOrmRepository.findById",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "cart.id": id,
        });

        this.metrics.incrementDBRequestCounter("SELECT");

        const end = this.metrics.measureDBOperationDuration(
          "cart.findById",
          "SELECT",
        );
        const ormEntity = await this.repo.findOne({
          where: { id },
          relations: ["items"],
        });
        end();

        if (!ormEntity) {
          span.setAttribute("cart.db.found", false);
          return null;
        }

        span.setAttribute("cart.db.found", true);
        const cart = EntityMapper.toDomainCart(ormEntity);

        return cart;
      },
    );
  }

  async findItemByUserIdAndCourseId(
    userId: string,
    courseId: string,
  ): Promise<CartItem | null> {
    return await this.tracer.startActiveSpan(
      "CartTypeOrmRepository.findItemByUserIdAndCourseId",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "cart.userId": userId,
          "cart.courseId": courseId,
        });

        const result = await this.findByUserId(userId);
        if (!result.cart) {
          span.setAttribute("cart.db.found", false);
          return null;
        }

        const courseItem = result.cart.items.find(
          (item) => item.courseId === courseId,
        );

        if (!courseItem) {
          span.setAttribute("cart.db.found", false);
          return null;
        }

        span.setAttribute("cart.db.found", true);
        return courseItem;
      },
    );
  }

  async findByUserId(
    userId: string,
    offset?: number,
    limit?: number,
  ): Promise<{ cart: Cart | null; totalItems: number }> {
    return await this.tracer.startActiveSpan(
      "CartTypeOrmRepository.findByUserId",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "user.id": userId,
        });
        this.metrics.incrementDBRequestCounter("SELECT");

        const end = this.metrics.measureDBOperationDuration(
          "cart.findByCourseId",
          "SELECT",
        );

        const cartEntity = await this.repo.findOne({
          where: { userId },
        });

        if (!cartEntity) {
          span.setAttribute("cart.db.found", false);
          return { cart: null, totalItems: 0 };
        }

        const totalItems = await this.cartItemRepo.count({
          where: { cartId: cartEntity.id },
        });

        const items = await this.cartItemRepo.find({
          where: { cartId: cartEntity.id },
          skip: offset || 0,
          take: limit || 10,
          order: { addedAt: "DESC" },
        });

        const cartWithItems = {
          ...cartEntity,
          items: items,
        };

        end();

        span.setAttribute("cart.db.found", true);
        const cart = EntityMapper.toDomainCart(cartWithItems);

        return { cart, totalItems };
      },
    );
  }

  async delete(cart: Cart): Promise<void> {
    return await this.tracer.startActiveSpan(
      "CartTypeOrmRepository.delete",
      async (span) => {
        span.setAttributes({
          "db.operation": "DELETE",
          "cart.id": cart.id,
        });

        this.metrics.incrementDBRequestCounter("DELETE");

        const end = this.metrics.measureDBOperationDuration(
          "cart.delete",
          "DELETE",
        );

        await this.cartItemRepo.delete({ cartId: cart.id });

        await this.repo.delete(cart.id);
        end();
      },
    );
  }

  async clearCart(userId: string): Promise<void> {
    return await this.tracer.startActiveSpan(
      "CartTypeOrmRepository.clearCart",
      async (span) => {
        span.setAttributes({
          "db.operation": "DELETE",
          "user.id": userId,
        });

        this.metrics.incrementDBRequestCounter("DELETE");
        const end = this.metrics.measureDBOperationDuration(
          "cart.clearCart",
          "DELETE",
        );

        const cartEntity = await this.repo.findOne({ where: { userId } });

        if (!cartEntity) {
          end();
          this.logger.warn(`No cart found for user ${userId} to clear`, {
            ctx: CartTypeOrmRepository.name,
          });
          return;
        }

        await this.cartItemRepo.delete({ cartId: cartEntity.id });

        end();

        this.logger.debug(`Cleared all items from cart for user ${userId}`, {
          ctx: CartTypeOrmRepository.name,
        });
      },
    );
  }

  async update(cart: Cart): Promise<void> {
    return await this.tracer.startActiveSpan(
      "CartTypeOrmRepository.update",
      async (span) => {
        span.setAttributes({
          "db.operation": "UPDATE",
          "cart.id": cart.id,
        });

        this.metrics.incrementDBRequestCounter("UPDATE");
        const end = this.metrics.measureDBOperationDuration(
          "cart.update",
          "UPDATE",
        );

        const ormEntity = EntityMapper.toOrmCart(cart);
        await this.repo.save(ormEntity);

        if (cart.items.length > 0) {
          await this.cartItemRepo.delete({ cartId: cart.id });

          const cartItemEntities = cart.items.map((item) =>
            EntityMapper.toOrmCartItem(item),
          );
          await this.cartItemRepo.save(cartItemEntities);
        }

        end();

        this.logger.debug(`Updated cart ${cart.id}`, {
          ctx: CartTypeOrmRepository.name,
        });
      },
    );
  }

  async addItem(cartItem: CartItem): Promise<void> {
    return await this.tracer.startActiveSpan(
      "CartTypeOrmRepository.addItem",
      async (span) => {
        span.setAttributes({
          "db.operation": "INSERT",
          "cart.id": cartItem.cartId,
          "course.id": cartItem.courseId,
        });

        const cartItemOrm = EntityMapper.toOrmCartItem(cartItem);

        this.metrics.incrementDBRequestCounter("INSERT");
        const end = this.metrics.measureDBOperationDuration(
          "cart.addItem",
          "INSERT",
        );

        await this.cartItemRepo.save(cartItemOrm);
        end();

        this.logger.debug(
          `Added item ${cartItem.courseId} to cart ${cartItem.cartId}`,
          {
            ctx: CartTypeOrmRepository.name,
          },
        );
      },
    );
  }

  async removeItem(cartId: string, courseId: string): Promise<void> {
    return await this.tracer.startActiveSpan(
      "CartTypeOrmRepository.removeItem",
      async (span) => {
        span.setAttributes({
          "db.operation": "DELETE",
          "cart.id": cartId,
          "course.id": courseId,
        });

        this.metrics.incrementDBRequestCounter("DELETE");
        const end = this.metrics.measureDBOperationDuration(
          "cart.removeItem",
          "DELETE",
        );

        const deleteResult = await this.cartItemRepo.delete({
          cartId,
          courseId,
        });
        end();
        if (deleteResult.affected === 0) {
          this.logger.warn(
            `No cart item found to remove for cartId=${cartId}, courseId=${courseId}`,
            { ctx: CartTypeOrmRepository.name },
          );
        }

        this.logger.debug(`Removed item ${courseId} from cart ${cartId}`, {
          ctx: CartTypeOrmRepository.name,
        });
      },
    );
  }
}
