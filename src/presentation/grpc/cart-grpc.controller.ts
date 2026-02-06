import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import {
  AddToCartRequest,
  AddToCartResponse,
  RemoveFromCartRequest,
  RemoveFromCartResponse,
  ListCartRequest,
  ListCartResponse,
  ToggleCartItemRequest,
  ToggleCartItemResponse,
  ClearCartRequest,
  ClearCartResponse,
} from "src/infrastructure/grpc/generated/user/types/cart_types";
import { AddToCartUseCase } from "src/application/use-cases/cart/add-to-cart.use-case";
import { RemoveFromCartUseCase } from "src/application/use-cases/cart/remove-cart.use-case";
import { GetCartByUserUseCase } from "src/application/use-cases/cart/get-cart-by-user.use-case";
import { Cart } from "src/domain/entities/cart.entity";
import { CartItem } from "src/domain/entities/cart-item.entity";
import { ToggleCartUseCase } from "src/application/use-cases/cart/toggle-cart.use-case";
import {
  Error,
  PaginationResponse,
} from "src/infrastructure/grpc/generated/user/common";
import { ClearCartUseCase } from "src/application/use-cases/cart/clear-cart.use-case";

@Controller()
export class CartGrpcController {
  constructor(
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly removeFromCartUseCase: RemoveFromCartUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    private readonly toggleCartItemUseCase: ToggleCartUseCase,
    private readonly getCartByUserUseCase: GetCartByUserUseCase,

    private readonly tracer: TracingService,
    private readonly logger: LoggingService
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.errorCode,
      message: error.message,
      details:
        "serializeError" in error && typeof error.serializeError === "function"
          ? error.serializeError()
          : [{ message: error.message }],
    };
  }

  @GrpcMethod("CartService", "AddToCart")
  async addToCart(data: AddToCartRequest): Promise<AddToCartResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CartGrpcController.addToCart",
        async (span) => {
          const { courseId, userId } = data!;

          span.setAttributes({ courseId, userId });
          this.logger.info("Handling `AddToCart` request ", {
            ctx: CartGrpcController.name,
          });

          const cartItem = await this.addToCartUseCase.execute(
            userId,
            courseId
          );

          this.logger.info("AddToCart request has been successfully completed");

          return {
            item: cartItem.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `AddToCart`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }

  @GrpcMethod("CartService", "ToggleCartItem")
  async toggleCart(
    data: ToggleCartItemRequest
  ): Promise<ToggleCartItemResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CartGrpcController.ToggleCartItem",
        async (span) => {
          const { courseId, userId } = data!;

          span.setAttributes({ courseId, userId });
          this.logger.info("Handling `ToggleCartItem` request ", {
            ctx: CartGrpcController.name,
          });

          const cartItem = await this.toggleCartItemUseCase.execute(
            userId,
            courseId
          );

          this.logger.info(
            "ToggleCartItem request has been successfully completed"
          );

          return {
            item: cartItem.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `AddToCart`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }
  @GrpcMethod("CartService", "RemoveFromCart")
  async removeFromCart(
    data: RemoveFromCartRequest
  ): Promise<RemoveFromCartResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CartGrpcController.removeFromCart",
        async (span) => {
          const { courseId, userId } = data!;

          span.setAttributes({ courseId, userId });
          this.logger.info("Handling `RemoveFromCart` request ", {
            ctx: CartGrpcController.name,
          });

          const cart = await this.removeFromCartUseCase.execute(
            userId,
            courseId
          );

          this.logger.info(
            "RemoveFromCart request has been successfully completed"
          );

          return {
            success: { removed: true },
          };
        }
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `RemoveFromCart`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }
  @GrpcMethod("CartService", "ClearCart")
  async clearCart(data: ClearCartRequest): Promise<ClearCartResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CartGrpcController.clearCart",
        async (span) => {
          const { userId } = data!;

          span.setAttributes({ userId });
          this.logger.info("Handling `clearCart` request ", {
            ctx: CartGrpcController.name,
          });

          const cart = await this.clearCartUseCase.execute(userId);

          this.logger.info("ClearCart request has been successfully completed");

          return {
            success: { removed: true },
          };
        }
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `RemoveFromCart`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }
  @GrpcMethod("CartService", "ListUserCart")
  async listUserCart(data: ListCartRequest): Promise<ListCartResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CartGrpcController.removeFromCart",
        async (span) => {
          const { pagination, userId } = data!;

          span.setAttributes({ userId });
          this.logger.info("Handling `ListUserCart` request ", {
            ctx: CartGrpcController.name,
          });

          const { cart, total } = await this.getCartByUserUseCase.execute(
            userId,
            pagination.page,
            pagination.pageSize
          );

          this.logger.info(
            "ListUserCart request has been successfully completed"
          );
          const paginationResponse: PaginationResponse = {
            totalItems: total, // Replace with actual total items if available
          };

          return {
            success: {
              cart: cart.toGrpcResponse(),
              pagination: paginationResponse,
            },
          };
        }
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `ListUserCart`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }

  // private mapToCartItemResponse(cartItem: CartItem): CartItemData {
  //   if (!cartItem) return;
  //   return {
  //     courseId: cartItem.getCourseId(),
  //     createdAt: cartItem.getAddedAt()?.toISOString(),
  //     id: cartItem.getId(),
  //   };
  // }

  // private mapToCartResponse(cart: Cart): CartData {
  //   if (!cart) return;
  //   return {
  //     createdAt: cart.getCreatedAt()?.toISOString(),
  //     id: cart.getId(),
  //     userId: cart.getUserId(),
  //     items: cart.getItems()?.map(this.mapToCartItemResponse),
  //     total: cart.getItems().length,
  //     updatedAt: cart.getUpdatedAt()?.toISOString(),
  //   };
  // }
}
