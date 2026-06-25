import { Injectable } from "@nestjs/common";
import {
  WishlistItemAlreadyExistException,
  WishlistItemNotFoundException,
} from "src/domain/exceptions";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IRemoveFromWishlistUseCase } from "../interfaces/remove-wishlist.interface";

@Injectable()
export class RemoveFromWishlistUseCase implements IRemoveFromWishlistUseCase {
  constructor(
    private readonly _wishlistRepository: IWishlistRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(userId: string, courseId: string): Promise<void> {
    return await this._tracer.startActiveSpan(
      "RemoveFromWishlistUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });

        this._logger.debug(`Removing from wishlist for  course ${courseId}`, {
          ctx: RemoveFromWishlistUseCase.name,
        });
        const { wishlist: userWishlist } =
          await this._wishlistRepository.findByUserId(userId);
        if (!userWishlist) {
          throw new WishlistItemNotFoundException(
            `wishlist for user ${userId} not found`,
          );
        }

        // Check if course exists
        const existInWishlist =
          await this._wishlistRepository.findItemByUserIdAndCourseId(
            userId,
            courseId,
          );
        if (existInWishlist) {
          throw new WishlistItemAlreadyExistException(
            `wishlist item course ${courseId} already exist`,
          );
        }

        if (!existInWishlist) {
          span.setAttribute("wishlist.found", false);
          throw new WishlistItemNotFoundException(
            `wishlist Item not found for user ${userWishlist.userId} with course ${courseId}`,
          );
        }
        span.setAttribute("wishlist.found", true);

        // Since wishlist entity doesn't have soft delete, we'll implement a hard delete
        await this._wishlistRepository.removeItem(userWishlist.id, courseId);
        span.setAttribute("wishlist.deleted", true);

        this._logger.debug(`wishlist item removed`, {
          ctx: RemoveFromWishlistUseCase.name,
        });
      },
    );
  }
}
