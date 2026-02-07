import { Injectable } from "@nestjs/common";
import { WishlistItemDto } from "src/application/dtos/wishlist.dto";
import { WishlistItem } from "src/domain/entities/wishlist-item.entity";
import { WishlistItemNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { KafkaService } from "src/infrastructure/kafka/kafka.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class ToggleWishlistUseCase {
  constructor(
    private readonly wishlistRepository: IWishlistRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(userId: string, courseId: string): Promise<WishlistItemDto> {
    return await this.tracer.startActiveSpan(
      "ToggleWishlistUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });
        this.logger.log(`Adding item to wishlist for course ${courseId}`, {
          ctx: ToggleWishlistUseCase.name,
        });
        const { wishlist: userWishlist } =
          await this.wishlistRepository.findByUserId(userId);
        if (!userWishlist) {
          throw new WishlistItemNotFoundException(
            `wishlist for user ${userId} not found`
          );
        }

        let wishlistItem: WishlistItem;

        // Check if course exists
        wishlistItem =
          await this.wishlistRepository.findItemByUserIdAndCourseId(
            userId,
            courseId
          );
        if (wishlistItem) {
          await this.wishlistRepository.removeItem(userWishlist.id, courseId);
        } else {
          wishlistItem = WishlistItem.create({
            courseId,
            wishlistId: userWishlist.id,
          });
          await this.wishlistRepository.addItem(wishlistItem);
        }
        return WishlistItemDto.fromDomain(wishlistItem);
      }
    );
  }
}
