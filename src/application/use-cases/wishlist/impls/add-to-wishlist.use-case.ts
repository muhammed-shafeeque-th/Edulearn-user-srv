import { Injectable } from "@nestjs/common";
import { WishlistItemDto } from "src/application/dtos/wishlist.dto";
import { WishlistItem } from "src/domain/entities/wishlist-item.entity";
import { Wishlist } from "src/domain/entities/wishlist.entity";
import {
  WishlistItemAlreadyExistException,
  WishlistItemNotFoundException,
} from "src/domain/exceptions";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { v4 as uuidv4 } from "uuid";
import { CourseClient } from "src/infrastructure/grpc/clients/course/course.client";
import { BadRequestException } from "@nestjs/common";
import { IAddToWishlistUseCase } from "../interfaces/add-to-wishlist.interface";

@Injectable()
export class AddToWishlistUseCase implements IAddToWishlistUseCase {
  constructor(
    private readonly _wishlistRepository: IWishlistRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
    private readonly courseClient: CourseClient,
  ) {}

  async execute(userId: string, courseId: string): Promise<WishlistItemDto> {
    return await this._tracer.startActiveSpan(
      "AddToWishlistUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });
        this._logger.log(`Adding item to wishlist for course ${courseId}`, {
          ctx: AddToWishlistUseCase.name,
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

        const courseResponse = await this.courseClient.getCourse(courseId);
        if (courseResponse?.course?.instructorId === userId) {
          throw new BadRequestException(
            "You cannot add your own course to wishlist",
          );
        }

        // Create wishlist
        const wishlistItem = WishlistItem.create({
          courseId,
          wishlistId: userWishlist.id,
        });

        await this._wishlistRepository.addItem(wishlistItem);

        return WishlistItemDto.fromDomain(wishlistItem);
      },
    );
  }
}
