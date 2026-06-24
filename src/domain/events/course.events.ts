import { BaseEvent } from "./base-event";

export const COURSE_EVENT_TYPES = {
  ENROLLED: "CourseEnrollmentEvent",
  CREATED: "CourseCreatedEvent",
} as const;

export interface CourseEnrollmentEvent
  extends BaseEvent<{
    instructorId: string;

    enrolledAt: string;

    enrollmentId: string;

    orderId: string;

    orderPrice: number;

    timestamp: number;

    courseId: string;

    studentId: string;
  }> {}

export interface CourseCreatedEvent
  extends BaseEvent<{
    instructorId: string;

    courseId: string;

    courseTitle: string;

    category?: string | undefined;

    status?: string | undefined;

    createdAt: Date;
  }> {}
