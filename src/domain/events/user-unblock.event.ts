import { UserRoles, UserStatus } from "../entities/user-entity";
import { BaseEvent } from "./base-event";

export interface UserUnblockedEvent extends BaseEvent< {
    userId: string;
    email: string;
    role: UserRoles;
    status: Exclude<UserStatus, UserStatus.BLOCKED>;
    firstName?: string;
    avatar?: string;
  }>{}