import {
  CourseCreatedEvent,
  CourseEnrollmentEvent,
} from "@/domain/events/course.events";

export function buildCourseEnrollmentEvent(
  payload: Partial<CourseEnrollmentEvent["payload"]> = {},
): CourseEnrollmentEvent {
  return {
    eventId: "evt-1",
    eventType: "CourseEnrollmentEvent",
    timestamp: Date.now(),
    payload: {
      instructorId: payload.instructorId ?? "instructor-1",
      studentId: payload.studentId ?? "student-1",
      courseId: payload.courseId ?? "course-1",
      enrollmentId: payload.enrollmentId ?? "enroll-1",
      orderId: payload.orderId ?? "order-1",
      orderPrice: payload.orderPrice ?? 5000, // 5000 subunits => 50.00
      enrolledAt: payload.enrolledAt ?? new Date().toISOString(),
      timestamp: payload.timestamp ?? Date.now(),
    },
  };
}
export function buildCourseCreatedEvent(
  payload: Partial<CourseCreatedEvent["payload"]> = {},
): CourseCreatedEvent {
  return {
    eventId: "evt-1",
    eventType: "CourseCreatedEvent",
    timestamp: Date.now(),
    payload: {
      instructorId: payload.instructorId ?? "instructor-1",
      courseId: payload.courseId ?? "course-1",
      courseTitle: payload.courseTitle ?? "course-title",
      category: payload.category ?? "cat-1",
      status: payload.status ?? "completed",
      createdAt: payload.createdAt ?? new Date(),
    },
  };
}
