import {  RoleStatus, UserRoles, UserStatus } from "../entities/user-entity";
import { BaseEvent } from "./base-event";

export interface UserAccountUnblockedEvent extends BaseEvent< {
    userId: string;
    email: string;
    status: Exclude<UserStatus, UserStatus.BLOCKED>;
    firstName?: string;
    avatar?: string;
    roles?: UserRoles[];
    roleStatus?: Record<UserRoles, RoleStatus>;
  }>{}