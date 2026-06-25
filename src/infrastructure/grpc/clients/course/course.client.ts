import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  BadRequestException,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { GRPC_COURSE_CLIENT_TOKEN } from "./constants";
import {
  EnrollmentServiceClient,
  CourseServiceClient,
} from "src/infrastructure/grpc/generated/course_service";
import { ClientServiceException } from "src/shared/exceptions/infra.exceptions";
import { CheckEnrollmentResponse } from "../../generated/course/types/enrollment";
import { CourseResponse } from "../../generated/course/types/course";
import { ILoggerService } from "src/application/adaptors/logger.service";

@Injectable()
export class CourseClient implements OnModuleDestroy, OnModuleInit {
  private enrollmentService!: EnrollmentServiceClient;
  private courseService!: CourseServiceClient;

  constructor(
    @Inject(GRPC_COURSE_CLIENT_TOKEN) private readonly _client: ClientGrpc,
    private readonly _logger: ILoggerService,
  ) {}

  onModuleInit(): void {
    this.enrollmentService =
      this._client.getService<EnrollmentServiceClient>("EnrollmentService");
    this.courseService =
      this._client.getService<CourseServiceClient>("CourseService");
    this._logger.info("Course gRPC client initialized");
  }

  onModuleDestroy(): void {
    this._logger.info("Course gRPC _client destroyed");
  }

  async getCourse(courseId: string): Promise<CourseResponse> {
    if (typeof courseId !== "string" || !courseId.trim()) {
      throw new BadRequestException("Invalid or missing courseId");
    }

    try {
      const response = await new Promise<CourseResponse>((resolve, reject) => {
        const observable = this.courseService.getCourse({ courseId });
        const subscription = observable.subscribe({
          next: (res: CourseResponse) => resolve(res),
          error: (error: any) =>
            reject(
              new ClientServiceException(
                error?.message || "Failed to fetch course",
              ),
            ),
          complete: () => subscription.unsubscribe(),
        });
      });

      if (response.error) {
        throw new ClientServiceException(
          response.error.message ||
            "Failed to fetch course from course service",
        );
      }

      return response;
    } catch (err: any) {
      this._logger.error("Error in getCourse", { error: err, courseId });
      throw err;
    }
  }

  /**
   * Checks if a user is enrolled in a given course.
   * Validates input, calls gRPC, and throws descriptive errors if invalid or any error occurs.
   */
  async checkCourseEnrollment(
    courseId: string,
    userId: string,
  ): Promise<{ isEnrolled: boolean }> {
    // Input validation
    if (typeof courseId !== "string" || !courseId.trim()) {
      this._logger.warn("Invalid courseId provided to checkCourseEnrollment", {
        courseId,
      });
      throw new BadRequestException("Invalid or missing courseId");
    }
    if (typeof userId !== "string" || !userId.trim()) {
      this._logger.warn("Invalid userId provided to checkCourseEnrollment", {
        userId,
      });
      throw new BadRequestException("Invalid or missing userId");
    }

    try {
      // Use observable and handle error, do not perform unnecessary manual promise/conversion
      const response: CheckEnrollmentResponse = await new Promise(
        (resolve, reject) => {
          const observable = this.enrollmentService.checkCourseEnrollment({
            courseId,
            userId,
          });
          const subscription = observable.subscribe({
            next: (res: CheckEnrollmentResponse) => {
              // Handle application-level errors sent inside response
              if (res.error) {
                this._logger.warn(
                  "Received error from enrollmentService.checkCourseEnrollment",
                  { error: res.error },
                );
                return reject(
                  new ClientServiceException(
                    res.error.message || "Unknown error from course service",
                  ),
                );
              }
              // Best practice: Always log status
              this._logger.debug(
                `Checked enrollment for userId=${userId} in courseId=${courseId}: isEnrolled=${res.enrolled}`,
              );
              resolve(res);
            },
            error: (error: any) => {
              this._logger.error(
                `Failed to check course enrollment for userId=${userId}, courseId=${courseId}: ${error?.message ?? error}`,
                { error },
              );
              reject(
                new ClientServiceException(
                  error?.details ||
                    error?.message ||
                    "Error while checking course enrollment",
                ),
              );
            },
            complete: () => {
              subscription.unsubscribe();
            },
          });
        },
      );

      // Defensive: Ensure the response shape is as expected
      const { enrolled } = response;
      return { isEnrolled: Boolean(enrolled) };
    } catch (err: any) {
      this._logger.error("Error in checkCourseEnrollment", {
        error: err,
        courseId,
        userId,
      });
      throw err;
    }
  }
}
