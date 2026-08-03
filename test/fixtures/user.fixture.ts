import User, { UserRoles, UserStatus } from "@/domain/entities/user-entity";
import { FAKE_EMAIL, FAKE_USER_ID } from "./constants";
import { InstructorProfile } from "@/domain/entities/instructor-profile.entity";
import { InstructorStudent } from "@/domain/entities/instructor-student.entity";

export function createMockUser(
  overrides?: Partial<{
    id: string;
    email: string;
    roles: UserRoles[];
    status: UserStatus;
    firstName: string;
    lastName: string;
  }>,
): User {
  return User.create({
    id: overrides?.id ?? FAKE_USER_ID,
    email: overrides?.email ?? FAKE_EMAIL,
    roles: overrides?.roles ?? [UserRoles.STUDENT],
    status: overrides?.status ?? UserStatus.ACTIVE,
    firstName: overrides?.firstName ?? "Test",
    lastName: overrides?.lastName ?? "User",
  });
}

export function createMockInstructorUser(
  overrides?: Partial<{
    id: string;
    email: string;
    roles: UserRoles[];
    status: UserStatus;
    firstName: string;
    lastName: string;
  }>,
): User {
  const now = new Date();
  const user = User.create({
    id: overrides?.id ?? "instructor-1",
    email: overrides?.email ?? "ins@example.com",
    roles: overrides?.roles ?? [UserRoles.INSTRUCTOR],
    status: overrides?.status ?? UserStatus.ACTIVE,
    firstName: overrides?.firstName ?? "Instructor",
    lastName: overrides?.lastName ?? "One",
    instructorProfile: InstructorProfile.create({
      userId: overrides?.id ?? "instructor-1",
      bio: "Test instructor",
    }),
    createdAt: now,
  });
  return user;
}
export function createMockInstructorStudent(overrides?: {
  id?: string;
  instructorId?: string;
  studentId?: string;
  lastName?: string;
}): InstructorStudent {
  return InstructorStudent.create({
    id: overrides.id ?? "rel-1",
    instructorId: overrides.instructorId ?? "instructor-1",
    studentId: overrides.studentId ?? "student-1",
  });
}
