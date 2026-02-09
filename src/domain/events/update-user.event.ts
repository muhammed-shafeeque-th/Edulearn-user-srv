import { UserRoles, UserStatus } from "../entities/user-entity";
import { BaseEvent } from "./base-event";


export interface UpdatedUserEvent extends BaseEvent<{
  userId: string;
  email: string;
  role: UserRoles;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: UserStatus;
}> { }
