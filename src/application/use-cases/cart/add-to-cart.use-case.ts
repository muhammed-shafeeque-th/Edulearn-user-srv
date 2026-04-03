import {  Injectable } from "@nestjs/common";
import { CartItemDto } from "src/application/dtos/cart.dto";
import { CartItem } from "src/domain/entities/cart-item.entity";
import {
  CartItemAlreadyExistException,
  CartItemNotFoundException,
  CartNotFoundException,
} from "src/domain/exceptions";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { CourseClient } from "src/infrastructure/grpc/clients/course/course.client";
import { KafkaService } from "src/infrastructure/kafka/kafka.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";
import { promiseTimeout } from "src/shared/utils/promise-timeout";

@Injectable()
export class AddToCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly kafkaProducer: KafkaService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
    private readonly courseServiceClient: CourseClient,
  ) {}

  async execute(userId: string, courseId: string): Promise<CartItemDto> {
    return await this.tracer.startActiveSpan(
      "AddToCartUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
        });
        this.logger.log(
          `Adding item to cart by user ${userId} for course ${courseId}`,
          { ctx: AddToCartUseCase.name },
        );

        const { cart: existCart } =
          await this.cartRepository.findByUserId(userId);
        if (!existCart) {
          throw new CartNotFoundException(
            `cart not found for user ${userId}`,
          );
        }

        // Check if course exists
        const existCartItem =
          await this.cartRepository.findItemByUserIdAndCourseId(
            userId,
            courseId,
          );
        if (existCartItem) {
          throw new CartItemAlreadyExistException(
            `course ${courseId} already exist in cart`,
          );
        }

        const courseResponse = await promiseTimeout(
          () => this.courseServiceClient.getCourse(courseId),
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
            this.courseServiceClient.checkCourseEnrollment(courseId, userId),
          `Timeout while checking course enrollment for course ${courseId}`,
        );

        if (enrollmentResult?.isEnrolled) {
          this.logger.warn(
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

        await this.cartRepository.addItem(cartItem);

        return CartItemDto.fromDomain(cartItem);
      },
    );
  }
}
