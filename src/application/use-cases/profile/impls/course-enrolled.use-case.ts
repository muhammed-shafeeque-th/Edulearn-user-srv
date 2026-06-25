import { Injectable } from "@nestjs/common";
import User from "src/domain/entities/user-entity";
import { CourseEnrollmentEvent } from "src/domain/events/course.events";
import { UserNotFoundException } from "src/domain/exceptions";
import { IInstructorStudentRepository } from "src/domain/repositories/instructor-student.repository";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ICourseEnrolledUseCase } from "../interfaces/course-enrolled.interface";

@Injectable()
export default class CourseEnrolledUseCase implements ICourseEnrolledUseCase {
  private readonly PLATFORM_COMMISSION_PERCENTAGE = 20;
  // Assume 100 subunits = 1 main unit
  private readonly NORMALIZATION_FACTOR = 100;

  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _walletRepository: IWalletRepository,
    private readonly _instructorStudentRepository: IInstructorStudentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  /**
   * Handles the course enrollment event.
   * - Updates instructor's student count and revenue.
   * - Ensures no duplicate revenue is credited per order.
   * @param dto CourseEnrollmentEventDto
   * @returns Updated User entity or null
   */
  public async execute(dto: CourseEnrollmentEvent): Promise<User | null> {
    return this._tracer.startActiveSpan(
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
          this._logger.debug(
            `Processing course enrollment for instructor [${payload.instructorId}], course [${payload.courseId}], student [${payload.studentId}]`,
          );

          // Validate instructor
          const user = await this._userRepository.findById(
            payload.instructorId,
          );
          if (!user) {
            const msg = `Instructor not found for id [${payload.instructorId}] during enrollment event.`;
            this._logger.error(msg);
            throw new UserNotFoundException(payload.instructorId);
          }

          // Safely increment instructor's student stats
          user.instructorProfile.incrementTotalStudents();

          // Add instructor revenue (with idempotency check)
          await this.addInstructorRevenueFromEnrollment(dto);

          await this.markInstructorStudentRelation({
            courseId: payload.courseId,
            instructorId: payload.instructorId,
            studentId: payload.studentId,
          });

          // Persist instructor stats update
          const updatedUser = await this._userRepository.update(
            payload.instructorId,
            user,
          );
          if (!updatedUser) {
            this._logger.error(
              `Failed to persist instructor [${payload.instructorId}] update after enrollment.`,
            );
            return null;
          }

          this._logger.debug(
            `Enrollment event handled: instructor [${payload.instructorId}] statistics updated.`,
          );
          return updatedUser;
        } catch (err: any) {
          this._logger.error(
            `Error in CourseEnrolledUseCase.execute: ${err?.message}`,
            err?.stack,
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
      },
    );
  }

  private async addInstructorRevenueFromEnrollment(
    dto: CourseEnrollmentEvent,
  ): Promise<void> {
    const { instructorId, orderId, orderPrice } = dto.payload;
    if (
      !instructorId ||
      !orderId ||
      typeof orderPrice !== "number" ||
      orderPrice <= 0
    ) {
      this._logger.warn(
        `Skipping revenue addition due to invalid parameters: instructorId=[${instructorId}], orderId=[${orderId}], orderPrice=[${orderPrice}]`,
      );
      return;
    }

    // Normalize orderPrice from SKU/subunits to main unit
    const normalizedOrderPrice = orderPrice / this.NORMALIZATION_FACTOR;

    try {
      // Retrieve instructor wallet
      const { wallet } =
        await this._walletRepository.findByUserId(instructorId);
      if (!wallet) {
        this._logger.debug(
          `No wallet found for instructor [${instructorId}] (expected to exist).`,
        );
        //  Deciding not to create wallet here if not found, fail silently.
        return;
      }

      // Idempotency: Check if transaction exists for this order
      const alreadyCredited =
        await this._walletRepository.findTransactionByWalletIdAndOrderId(
          wallet.id,
          orderId,
        );
      if (alreadyCredited) {
        this._logger.debug(
          `Revenue already processed for order [${orderId}], wallet [${wallet.id}]; skipping duplicate credit.`,
        );
        return;
      }

      // Compute instructor's revenue (after commission) on normalized amount
      const revenueAmount = Number(
        (
          normalizedOrderPrice *
          (1 - this.PLATFORM_COMMISSION_PERCENTAGE / 100)
        ).toFixed(2),
      );

      // Domain-only balance mutation, actual persistence in repository
      const transaction = wallet.deposit(
        revenueAmount,
        `Course enrollment revenue from order ${orderId}`,
        orderId,
      );

      await Promise.all([
        this._walletRepository.save(wallet),
        this._walletRepository.addTransaction(transaction),
      ]);

      this._logger.debug(
        `Instructor [${instructorId}] wallet [${wallet.id}] credited with revenue [${revenueAmount}] for order [${orderId}] (normalized from [${orderPrice}]).`,
      );
    } catch (error: any) {
      this._logger.error(
        `Failed to add instructor revenue for enrollment (instructorId=[${instructorId}], orderId=[${orderId}]): ${error?.message}`,
        error?.stack,
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

    this._logger.debug("Marking instructor student relation", {
      ctx: CourseEnrolledUseCase.name,
      courseId,
      instructorId,
      studentId,
    });
    return this._instructorStudentRepository.upsertRelation({
      studentId: studentId,
      instructorId: instructorId,
      firstCourseId: courseId,
    });
  }
}
