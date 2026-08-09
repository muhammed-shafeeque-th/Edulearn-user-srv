import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { DomainException } from "src/domain/exceptions";
import {
  AddToWishlistRequest,
  AddToWishlistResponse,
  RemoveFromWishlistRequest,
  RemoveFromWishlistResponse,
  ListWishlistRequest,
  ListWishlistResponse,
  ToggleWishlistItemResponse,
  ToggleWishlistItemRequest,
} from "src/infrastructure/grpc/generated/user/types/wishlist_types";
import { IAddToWishlistUseCase } from "src/application/use-cases/wishlist/interfaces/add-to-wishlist.interface";
import { IRemoveFromWishlistUseCase } from "src/application/use-cases/wishlist/interfaces/remove-wishlist.interface";
import { IGetWishlistByUserUseCase } from "src/application/use-cases/wishlist/interfaces/get-wishlist-by-user.interface";
import { IToggleWishlistUseCase } from "src/application/use-cases/wishlist/interfaces/toggle-wishlist.interface";
import {
  Error,
  PaginationResponse,
} from "src/infrastructure/grpc/generated/user/common";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";
import { WishlistItemMapper, WishlistMapper } from "../mappers/wishlist.mapper";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class WishlistGrpcController {
  constructor(
    private readonly _addToWishlistUseCase: IAddToWishlistUseCase,
    private readonly _removeFromWishlistUseCase: IRemoveFromWishlistUseCase,
    private readonly _toggleWishlistItemUseCase: IToggleWishlistUseCase,
    private readonly _getWishlistByUserUseCase: IGetWishlistByUserUseCase,

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

  @GrpcMethod("WishlistService", "AddToWishlist")
  async addToWishlist(
    data: AddToWishlistRequest,
  ): Promise<AddToWishlistResponse> {
    return await this._tracer.startActiveSpan(
      "WishlistGrpcController.addToWishlist",
      async (span) => {
        const { courseId, userId } = data!;

        span.setAttributes({ courseId, userId });
        this._logger.debug("Handling `AddToWishlist` request ", {
          ctx: WishlistGrpcController.name,
        });

        const wishlistItem = await this._addToWishlistUseCase.execute(
          userId,
          courseId,
        );

        this._logger.debug(
          "AddToWishlist request has been successfully completed",
        );

        return {
          item: WishlistItemMapper.toGrpcResponse(wishlistItem),
        };
      },
    );
  }

  @GrpcMethod("WishlistService", "ToggleWishlistItem")
  async toggleWishlist(
    data: ToggleWishlistItemRequest,
  ): Promise<ToggleWishlistItemResponse> {
    return await this._tracer.startActiveSpan(
      "WishlistGrpcController.ToggleWishlistItem",
      async (span) => {
        const { courseId, userId } = data!;

        span.setAttributes({ courseId, userId });
        this._logger.debug("Handling `ToggleWishlistItem` request ", {
          ctx: WishlistGrpcController.name,
        });

        const wishlistItem = await this._toggleWishlistItemUseCase.execute(
          userId,
          courseId,
        );

        this._logger.debug(
          "ToggleWishlistItem request has been successfully completed",
        );

        return {
          item: WishlistItemMapper.toGrpcResponse(wishlistItem),
        };
      },
    );
  }

  @GrpcMethod("WishlistService", "RemoveFromWishlist")
  async removeFromWishlist(
    data: RemoveFromWishlistRequest,
  ): Promise<RemoveFromWishlistResponse> {
    return await this._tracer.startActiveSpan(
      "WishlistGrpcController.removeFromWishlist",
      async (span) => {
        const { courseId, userId } = data!;

        span.setAttributes({ courseId, userId });
        this._logger.debug("Handling `RemoveFromWishlist` request ", {
          ctx: WishlistGrpcController.name,
        });

        await this._removeFromWishlistUseCase.execute(userId, courseId);

        this._logger.debug(
          "RemoveFromWishlist request has been successfully completed",
        );

        return {
          success: { removed: true },
        };
      },
    );
  }
  @GrpcMethod("WishlistService", "ListUserWishlist")
  async listUserWishlist(
    data: ListWishlistRequest,
  ): Promise<ListWishlistResponse> {
    return await this._tracer.startActiveSpan(
      "WishlistGrpcController.listUserWishlist",
      async (span) => {
        const { pagination, userId } = data!;

        span.setAttributes({ userId });
        this._logger.debug("Handling `ListUserWishlist` request ", {
          ctx: WishlistGrpcController.name,
        });

        const { wishlist, total } =
          await this._getWishlistByUserUseCase.execute(
            userId,
            pagination.page,
            pagination.pageSize,
          );

        this._logger.debug(
          "ListUserWishlist request has been successfully completed",
        );
        const paginationResponse: PaginationResponse = {
          totalItems: total, // Replace with actual total items if available
        };

        return {
          success: {
            wishlist: WishlistMapper.toGrpcResponse(wishlist),
            pagination: paginationResponse,
          },
        };
      },
    );
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
