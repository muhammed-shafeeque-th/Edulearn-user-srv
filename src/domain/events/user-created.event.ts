import { UserRoles, UserStatus } from "../entities/user-entity";
import { BaseEvent } from "./base-event";


export const USER_EVENT_TYPES = {
  CREATED: 'UserAccountCreatedEvent'
} as const;



export interface UserAccountCreatedEvent extends BaseEvent<{
  userId: string;
  email: string;
  roles: UserRoles[];
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: UserStatus;
  createdAt?: Date;
}> { }