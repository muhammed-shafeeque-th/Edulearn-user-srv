import { UserRoles, UserStatus } from "../entities/user-entity";
import { BaseEvent } from "./base-event";

export interface UserBlockedEvent extends BaseEvent< {
    userId: string;
    email: string;
    role: UserRoles;
    status: UserStatus.BLOCKED;
    firstName?: string;
    avatar?: string;
  }> {}