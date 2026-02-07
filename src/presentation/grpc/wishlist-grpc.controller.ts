import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import {
  AddToWishlistRequest,
  AddToWishlistResponse,
  RemoveFromWishlistRequest,
  RemoveFromWishlistResponse,
  WishlistData,
  WishlistItemData,
  ListWishlistRequest,
  ListWishlistResponse,
  ToggleWishlistItemResponse,
  ToggleWishlistItemRequest,
} from "src/infrastructure/grpc/generated/user/types/wishlist_types";
import { AddToWishlistUseCase } from "src/application/use-cases/wishlist/add-to-wishlist.use-case";
import { RemoveFromWishlistUseCase } from "src/application/use-cases/wishlist/remove-wishlist.use-case";
import { GetWishlistByUserUseCase } from "src/application/use-cases/wishlist/get-wishlist-by-user.use-case";
import { ToggleWishlistUseCase } from "src/application/use-cases/wishlist/toggle-wishlist.use-case copy";
import { Error, PaginationResponse } from "src/infrastructure/grpc/generated/user/common";

@Controller()
export class WishlistGrpcController {
  constructor(
    private readonly addToWishlistUseCase: AddToWishlistUseCase,
    private readonly removeFromWishlistUseCase: RemoveFromWishlistUseCase,
    private readonly toggleWishlistItemUseCase: ToggleWishlistUseCase,
    private readonly getWishlistByUserUseCase: GetWishlistByUserUseCase,

    private readonly tracer: TracingService,
    private readonly logger: LoggingService
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.errorCode,
      message: error.message,
      details:  "serializeError" in error && typeof error.serializeError === "function"
      ? error.serializeError()
      : [{ message: error.message }],
    };
  }

  @GrpcMethod("WishlistService", "AddToWishlist")
  async addToWishlist(
    data: AddToWishlistRequest
  ): Promise<AddToWishlistResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "WishlistGrpcController.addToWishlist",
        async (span) => {
          const { courseId, userId } = data!;

          span.setAttributes({ courseId, userId });
          this.logger.info("Handling `AddToWishlist` request ", {
            ctx: WishlistGrpcController.name,
          });

          const wishlistItem = await this.addToWishlistUseCase.execute(
            userId,
            courseId
          );

          this.logger.info(
            "AddToWishlist request has been successfully completed"
          );

          return {
            item: wishlistItem.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `AddToWishlist`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }

  @GrpcMethod("WishlistService", "ToggleWishlistItem")
  async toggleWishlist(
    data: ToggleWishlistItemRequest
  ): Promise<ToggleWishlistItemResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "WishlistGrpcController.ToggleWishlistItem",
        async (span) => {
          const { courseId, userId } = data!;

          span.setAttributes({ courseId, userId });
          this.logger.info("Handling `ToggleWishlistItem` request ", {
            ctx: WishlistGrpcController.name,
          });

          const cartItem = await this.toggleWishlistItemUseCase.execute(
            userId,
            courseId
          );

          this.logger.info(
            "ToggleWishlistItem request has been successfully completed"
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

  @GrpcMethod("WishlistService", "RemoveFromWishlist")
  async removeFromWishlist(
    data: RemoveFromWishlistRequest
  ): Promise<RemoveFromWishlistResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "WishlistGrpcController.removeFromWishlist",
        async (span) => {
          const { courseId, userId } = data!;

          span.setAttributes({ courseId, userId });
          this.logger.info("Handling `RemoveFromWishlist` request ", {
            ctx: WishlistGrpcController.name,
          });

          const wishlist = await this.removeFromWishlistUseCase.execute(
            userId,
            courseId
          );

          this.logger.info(
            "RemoveFromWishlist request has been successfully completed"
          );

          return {
            success: { removed: true },
          };
        }
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `RemoveFromWishlist`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }
  @GrpcMethod("WishlistService", "ListUserWishlist")
  async listUserWishlist(
    data: ListWishlistRequest
  ): Promise<ListWishlistResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "WishlistGrpcController.listUserWishlist",
        async (span) => {
          const { pagination, userId } = data!;

          span.setAttributes({ userId });
          this.logger.info("Handling `ListUserWishlist` request ", {
            ctx: WishlistGrpcController.name,
          });

          const { wishlist, total } =
            await this.getWishlistByUserUseCase.execute(
              userId,
              pagination.page,
              pagination.pageSize
            );

          this.logger.info(
            "ListUserWishlist request has been successfully completed"
          );
          const paginationResponse: PaginationResponse = {
            totalItems: total, // Replace with actual total items if available
          };

          return {
            success: {
              wishlist: wishlist.toGrpcResponse(),
              pagination: paginationResponse,
            },
          };
        }
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `ListUserWishlist`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }

  // private mapToWishlistItemResponse(
  //   wishlistItem: WishlistItem
  // ): WishlistItemData {
  //   if (!wishlistItem) return;
  //   return {
  //     courseId: wishlistItem.getCourseId(),
  //     createdAt: wishlistItem.getAddedAt()?.toISOString(),
  //     id: wishlistItem.getId(),
  //   };
  // }

  // private mapToWishlistResponse(wishlist: Wishlist): WishlistData {
  //   if (!wishlist) return;
  //   return {
  //     createdAt: wishlist.getCreatedAt()?.toISOString(),
  //     id: wishlist.getId(),
  //     userId: wishlist.getUserId(),
  //     items: wishlist.getItems()?.map(this.mapToWishlistItemResponse),
  //     total: wishlist.getItems().length,
  //     updatedAt: wishlist.getUpdatedAt()?.toISOString(),
  //   };
  // }
}
