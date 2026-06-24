import { UserRoles, UserStatus } from "../entities/user-entity";
import { BaseEvent } from "./base-event";

export interface InstructorRegisterEvent
  extends BaseEvent<{
    userId: string;
    email: string;
    roles: [UserRoles.STUDENT, UserRoles.INSTRUCTOR];
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status?: UserStatus;
  }> {}
