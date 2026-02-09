import { Injectable } from "@nestjs/common";
import User from "src/domain/entities/user.entity";
import { CourseEnrollmentEvent } from "src/domain/events/course.events";
import { UserNotFoundException } from "src/domain/exceptions";
import { IInstructorStudentRepository } from "src/domain/repositories/instructor-student.repository";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export default class CourseEnrolledUseCase {
  private readonly PLATFORM_COMMISSION_PERCENTAGE = 20;
  // Assume 100 subunits = 1 main unit
  private readonly NORMALIZATION_FACTOR = 100;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly instructorStudentRepository: IInstructorStudentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }

  /**
   * Handles the course enrollment event.
   * - Updates instructor's student count and revenue.
   * - Ensures no duplicate revenue is credited per order.
   * @param dto CourseEnrollmentEventDto
   * @returns Updated User entity or null
   */
  public async execute(dto: CourseEnrollmentEvent): Promise<User | null> {
    return this.tracer.startActiveSpan(
      "CourseEnrolledUseCase.execute",
      async (span) => {
        const { payload } = dto;
        span.setAttributes({
          instructorId: payload.instructorId,
          courseId: payload.courseId,
          studentId: payload.studentId,
          enrollmentId: payload.enrollmentId,
          orderId: payload.orderId,
        });

        try {
          this.logger.info(
            `Processing course enrollment for instructor [${payload.instructorId}], course [${payload.courseId}], student [${payload.studentId}]`
          );

          // Validate instructor
          const user = await this.userRepository.findById(payload.instructorId);
          if (!user) {
            const msg = `Instructor not found for id [${payload.instructorId}] during enrollment event.`;
            this.logger.error(msg);
            throw new UserNotFoundException(payload.instructorId);
          }

          // Safely increment instructor's student stats
          user.instructorProfile.incrementTotalStudents();

          // Add instructor revenue (with idempotency check)
          await this.addInstructorRevenueFromEnrollment(dto);

          await this.markInstructorStudentRelation({ courseId: payload.courseId, instructorId: payload.instructorId, studentId: payload.studentId })

          // Persist instructor stats update
          const updatedUser = await this.userRepository.update(
            payload.instructorId,
            user
          );
          if (!updatedUser) {
            this.logger.error(
              `Failed to persist instructor [${payload.instructorId}] update after enrollment.`
            );
            return null;
          }

          this.logger.info(
            `Enrollment event handled: instructor [${payload.instructorId}] statistics updated.`
          );
          return updatedUser;
        } catch (err: any) {
          this.logger.error(
            `Error in CourseEnrolledUseCase.execute: ${err?.message}`,
            err?.stack
          );
          span.recordException(err);
          span.setStatus({
            code: 2,
            message: err?.message || "Unhandled error",
          });
          throw err;
        } finally {
          span.end();
        }
      }
    );
  }

  private async addInstructorRevenueFromEnrollment(
    dto: CourseEnrollmentEvent
  ): Promise<void> {
    const { instructorId, orderId, orderPrice } = dto.payload;
    if (
      !instructorId ||
      !orderId ||
      typeof orderPrice !== "number" ||
      orderPrice <= 0
    ) {
      this.logger.warn(
        `Skipping revenue addition due to invalid parameters: instructorId=[${instructorId}], orderId=[${orderId}], orderPrice=[${orderPrice}]`
      );
      return;
    }

    // Normalize orderPrice from SKU/subunits to main unit
    const normalizedOrderPrice = orderPrice / this.NORMALIZATION_FACTOR;

    try {
      // Retrieve instructor wallet
      const { wallet } = await this.walletRepository.findByUserId(instructorId);
      if (!wallet) {
        this.logger.info(
          `No wallet found for instructor [${instructorId}] (expected to exist).`
        );
        //  Deciding not to create wallet here if not found, fail silently.
        return;
      }

      // Idempotency: Check if transaction exists for this order
      const alreadyCredited =
        await this.walletRepository.findTransactionByWalletIdAndOrderId(
          wallet.id,
          orderId
        );
      if (alreadyCredited) {
        this.logger.info(
          `Revenue already processed for order [${orderId}], wallet [${wallet.id}]; skipping duplicate credit.`
        );
        return;
      }

      // Compute instructor's revenue (after commission) on normalized amount
      const revenueAmount = Number(
        (
          normalizedOrderPrice *
          (1 - this.PLATFORM_COMMISSION_PERCENTAGE / 100)
        ).toFixed(2)
      );

      // Domain-only balance mutation, actual persistence in repository
      const transaction = wallet.deposit(
        revenueAmount,
        `Course enrollment revenue from order ${orderId}`,
        orderId
      );

      await Promise.all([
        this.walletRepository.save(wallet),
        this.walletRepository.addTransaction(transaction),
      ]);

      this.logger.info(
        `Instructor [${instructorId}] wallet [${wallet.id}] credited with revenue [${revenueAmount}] for order [${orderId}] (normalized from [${orderPrice}]).`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to add instructor revenue for enrollment (instructorId=[${instructorId}], orderId=[${orderId}]): ${error?.message}`,
        error?.stack
      );
      throw error;
    }
  }


  private async markInstructorStudentRelation(input: {
    studentId: string;
    instructorId: string;
    courseId: string;
  }) {
    const { courseId, instructorId, studentId } = input;

    this.logger.debug("Marking instructor student relation", {
      ctx: CourseEnrolledUseCase.name,
      courseId,
      instructorId,
      studentId,
    })
    return this.instructorStudentRepository.upsertRelation({
      studentId: studentId,
      instructorId: instructorId,
      firstCourseId: courseId,
    });
  }
}
