import { UserRoles, UserStatus } from "../entities/user-entity";
import { BaseEvent } from "./base-event";


export const USER_EVENT_TYPES = {
  CREATED: 'UserCreatedEvent'
} as const;



export interface UserCreatedEvent extends BaseEvent<{
  userId: string;
  email: string;
  role: UserRoles;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: UserStatus;
  createdAt?: Date;
}> { }