import { Injectable } from "@nestjs/common";
import { CartItemDto } from "src/application/dtos/cart.dto";
import { CartItem } from "src/domain/entities/cart-item.entity";
import {
  CartItemAlreadyExistException,
  CartItemNotFoundException,
  CartNotFoundException,
} from "src/domain/exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { CourseClient } from "src/infrastructure/grpc/clients/course/course.client";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";
import { promiseTimeout } from "src/shared/utils/promise-timeout";
import { IAddToCartUseCase } from "../interfaces/add-to-cart.interface";

@Injectable()
export class AddToCartUseCase implements IAddToCartUseCase {
  constructor(
    private readonly _cartRepository: ICartRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
    private readonly _courseServiceClient: CourseClient,
  ) {}

  async execute(userId: string, courseId: string): Promise<CartItemDto> {
    return await this._tracer.startActiveSpan(
      "AddToCartUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });
        this._logger.log(
          `Adding item to cart by user ${userId} for course ${courseId}`,
          { ctx: AddToCartUseCase.name },
        );

        const { cart: existCart } =
          await this._cartRepository.findByUserId(userId);
        if (!existCart) {
          throw new CartNotFoundException(`cart not found for user ${userId}`);
        }

        // Check if course exists
        const existCartItem =
          await this._cartRepository.findItemByUserIdAndCourseId(
            userId,
            courseId,
          );
        if (existCartItem) {
          throw new CartItemAlreadyExistException(
            `course ${courseId} already exist in cart`,
          );
        }

        const courseResponse = await promiseTimeout(
          () => this._courseServiceClient.getCourse(courseId),
          `Timeout while fetching course details for course ${courseId}`,
        );

        if (!courseResponse || !courseResponse.course) {
          throw new BadRequestException("Course not found");
        }

        if (courseResponse.course.instructorId === userId) {
          throw new BadRequestException(
            "You cannot add your own course to cart",
          );
        }

        const enrollmentResult = await promiseTimeout(
          () =>
            this._courseServiceClient.checkCourseEnrollment(courseId, userId),
          `Timeout while checking course enrollment for course ${courseId}`,
        );

        if (enrollmentResult?.isEnrolled) {
          this._logger.warn(
            `User ${userId} is already enrolled in course ${courseId}, not adding to cart.`,
            { userId, courseId },
          );
          throw new BadRequestException(
            "User is already enrolled in this course",
          );
        }

        // Create cart
        const cartItem = CartItem.create({
          courseId: courseId,
          cartId: existCart.id,
        });

        await this._cartRepository.addItem(cartItem);

        return CartItemDto.fromDomain(cartItem);
      },
    );
  }
}
