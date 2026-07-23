import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { DomainException } from "src/domain/exceptions";
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
import { IAddToCartUseCase } from "src/application/use-cases/cart/interfaces/add-to-cart.interface";
import { IRemoveFromCartUseCase } from "src/application/use-cases/cart/interfaces/remove-cart.interface";
import { IGetCartByUserUseCase } from "src/application/use-cases/cart/interfaces/get-cart-by-user.interface";
import { IToggleCartUseCase } from "src/application/use-cases/cart/interfaces/toggle-cart.interface";
import {
  Error,
  PaginationResponse,
} from "src/infrastructure/grpc/generated/user/common";
import { IClearCartUseCase } from "src/application/use-cases/cart/interfaces/clear-cart.interface";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class CartGrpcController {
  constructor(
    private readonly _addToCartUseCase: IAddToCartUseCase,
    private readonly _removeFromCartUseCase: IRemoveFromCartUseCase,
    private readonly _clearCartUseCase: IClearCartUseCase,
    private readonly _toggleCartItemUseCase: IToggleCartUseCase,
    private readonly _getCartByUserUseCase: IGetCartByUserUseCase,

    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.code,
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
      return await this._tracer.startActiveSpan(
        "CartGrpcController.addToCart",
        async (span) => {
          const { courseId, userId } = data!;

          span.setAttributes({ courseId, userId });
          this._logger.debug("Handling `AddToCart` request ", {
            ctx: CartGrpcController.name,
          });

          const cartItem = await this._addToCartUseCase.execute(
            userId,
            courseId,
          );

          this._logger.debug(
            "AddToCart request has been successfully completed",
          );

          return {
            item: cartItem.toGrpcResponse(),
          };
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `AddToCart`", {
        error,
      });
      throw error;
    }
  }

  @GrpcMethod("CartService", "ToggleCartItem")
  async toggleCart(
    data: ToggleCartItemRequest,
  ): Promise<ToggleCartItemResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CartGrpcController.ToggleCartItem",
        async (span) => {
          const { courseId, userId } = data!;

          span.setAttributes({ courseId, userId });
          this._logger.debug("Handling `ToggleCartItem` request ", {
            ctx: CartGrpcController.name,
          });

          const cartItem = await this._toggleCartItemUseCase.execute(
            userId,
            courseId,
          );

          this._logger.debug(
            "ToggleCartItem request has been successfully completed",
          );

          return {
            item: cartItem.toGrpcResponse(),
          };
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `AddToCart`", {
        error,
      });
      throw error;
    }
  }
  @GrpcMethod("CartService", "RemoveFromCart")
  async removeFromCart(
    data: RemoveFromCartRequest,
  ): Promise<RemoveFromCartResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CartGrpcController.removeFromCart",
        async (span) => {
          const { courseId, userId } = data!;

          span.setAttributes({ courseId, userId });
          this._logger.debug("Handling `RemoveFromCart` request ", {
            ctx: CartGrpcController.name,
          });

          await this._removeFromCartUseCase.execute(userId, courseId);

          this._logger.debug(
            "RemoveFromCart request has been successfully completed",
          );

          return {
            success: { removed: true },
          };
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `RemoveFromCart`", {
        error,
      });
      throw error;
    }
  }
  @GrpcMethod("CartService", "ClearCart")
  async clearCart(data: ClearCartRequest): Promise<ClearCartResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CartGrpcController.clearCart",
        async (span) => {
          const { userId } = data!;

          span.setAttributes({ userId });
          this._logger.debug("Handling `clearCart` request ", {
            ctx: CartGrpcController.name,
          });

          await this._clearCartUseCase.execute(userId);

          this._logger.debug(
            "ClearCart request has been successfully completed",
          );

          return {
            success: { removed: true },
          };
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `RemoveFromCart`", {
        error,
      });
      throw error;
    }
  }
  @GrpcMethod("CartService", "ListUserCart")
  async listUserCart(data: ListCartRequest): Promise<ListCartResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CartGrpcController.removeFromCart",
        async (span) => {
          const { pagination, userId } = data!;

          span.setAttributes({ userId });
          this._logger.debug("Handling `ListUserCart` request ", {
            ctx: CartGrpcController.name,
          });

          const { cart, total } = await this._getCartByUserUseCase.execute(
            userId,
            pagination.page,
            pagination.pageSize,
          );

          this._logger.debug(
            "ListUserCart request has been successfully completed",
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
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `ListUserCart`", {
        error,
      });
      throw error;
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
