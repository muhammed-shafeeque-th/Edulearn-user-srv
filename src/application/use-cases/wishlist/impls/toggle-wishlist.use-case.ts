import { Injectable } from "@nestjs/common";
import { WishlistItemDto } from "src/application/dtos/wishlist.dto";
import { WishlistItem } from "src/domain/entities/wishlist-item.entity";
import { WishlistItemNotFoundException } from "src/domain/exceptions";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { CourseClient } from "src/infrastructure/grpc/clients/course/course.client";
import { BadRequestException } from "@nestjs/common";
import { IToggleWishlistUseCase } from "../interfaces/toggle-wishlist.interface";

@Injectable()
export class ToggleWishlistUseCase implements IToggleWishlistUseCase {
  constructor(
    private readonly _wishlistRepository: IWishlistRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
    private readonly courseClient: CourseClient,
  ) {}

  async execute(userId: string, courseId: string): Promise<WishlistItemDto> {
    return await this._tracer.startActiveSpan(
      "ToggleWishlistUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });
        this._logger.log(`Adding item to wishlist for course ${courseId}`, {
          ctx: ToggleWishlistUseCase.name,
        });
        const { wishlist: userWishlist } =
          await this._wishlistRepository.findByUserId(userId);
        if (!userWishlist) {
          throw new WishlistItemNotFoundException(
            `wishlist for user ${userId} not found`,
          );
        }

        let wishlistItem: WishlistItem;

        // Check if course exists
        wishlistItem =
          await this._wishlistRepository.findItemByUserIdAndCourseId(
            userId,
            courseId,
          );
        if (wishlistItem) {
          await this._wishlistRepository.removeItem(userWishlist.id, courseId);
        } else {
          const courseResponse = await this.courseClient.getCourse(courseId);
          if (courseResponse?.course?.instructorId === userId) {
            throw new BadRequestException(
              "You cannot add your own course to wishlist",
            );
          }
          wishlistItem = WishlistItem.create({
            courseId,
            wishlistId: userWishlist.id,
          });
          await this._wishlistRepository.addItem(wishlistItem);
        }
        return WishlistItemDto.fromDomain(wishlistItem);
      },
    );
  }
}
