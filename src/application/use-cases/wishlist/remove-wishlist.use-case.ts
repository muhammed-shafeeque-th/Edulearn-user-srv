import { Injectable } from "@nestjs/common";
import {
  WishlistItemAlreadyExistException,
  WishlistItemNotFoundException,
} from "src/domain/exceptions/domain.exceptions";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class RemoveFromWishlistUseCase {
  constructor(
    private readonly wishlistRepository: IWishlistRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(userId: string, courseId: string): Promise<void> {
    return await this.tracer.startActiveSpan(
      "RemoveFromWishlistUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });

        this.logger.debug(`Removing from wishlist for  course ${courseId}`, {
          ctx: RemoveFromWishlistUseCase.name,
        });
        const { wishlist: userWishlist } =
          await this.wishlistRepository.findByUserId(userId);
        if (!userWishlist) {
          throw new WishlistItemNotFoundException(
            `wishlist for user ${userId} not found`
          );
        }

        // Check if course exists
        const existInWishlist =
          await this.wishlistRepository.findItemByUserIdAndCourseId(
            userId,
            courseId
          );
        if (existInWishlist) {
          throw new WishlistItemAlreadyExistException(
            `wishlist item course ${courseId} already exist`
          );
        }

        if (!existInWishlist) {
          span.setAttribute("wishlist.found", false);
          throw new WishlistItemNotFoundException(
            `wishlist Item not found for user ${userWishlist.userId} with course ${courseId}`
          );
        }
        span.setAttribute("wishlist.found", true);

        // Since wishlist entity doesn't have soft delete, we'll implement a hard delete
        await this.wishlistRepository.removeItem(userWishlist.id, courseId);
        span.setAttribute("wishlist.deleted", true);

        this.logger.debug(`wishlist item removed`, {
          ctx: RemoveFromWishlistUseCase.name,
        });
      }
    );
  }
}
