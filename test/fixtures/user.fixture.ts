import User, { UserRoles, UserStatus } from "@/domain/entities/user-entity";
import { FAKE_EMAIL, FAKE_USER_ID } from "./constants";

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
