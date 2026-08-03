import { v4 as uuidV4 } from "uuid";
import { InstructorProfile } from "./instructor-profile.entity";
import { Gender, UserProfile } from "./user-profile.entity";
import { UserSocials } from "./user-socials.entity";
import { Wallet } from "./user-wallet.entity";

export enum UserRoles {
  ADMIN = "admin",
  INSTRUCTOR = "instructor",
  STUDENT = "student",
}

export enum UserStatus {
  VERIFIED = "verified",
  NOT_VERIFIED = "not-verified",
  ACTIVE = "active",
  DELETED = "deleted",
  NOT_ACTIVE = "not-active",
  BLOCKED = "blocked",
}

export enum RoleStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  BLOCKED = "blocked",
}

export interface UserProps {
  id: string;
  email: string;
  roles?: UserRoles[];
  roleStatus?: Partial<Record<UserRoles, RoleStatus>>;
  status: UserStatus;
  username?: string;
  slug?: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
  lastLoginAt?: Date | undefined;
  profile?: UserProfile;
  instructorProfile?: InstructorProfile;
  socials?: UserSocials[];
  createdAt?: Date;
  updatedAt?: Date;
}

type UpdatableUserProps = Partial<
  Pick<UserProps, "firstName" | "lastName" | "username" | "slug" | "avatar">
>;

export class User {
  private readonly _id: string;
  private _email: string;
  private _roles: UserRoles[];
  private _roleStatus: Record<UserRoles, RoleStatus>;
  private _status: UserStatus;
  private _username?: string;
  private _slug?: string;
  private _firstName: string;
  private _lastName?: string;
  private _avatar?: string;
  private _lastLoginAt?: Date;
  private _profile?: UserProfile;
  private _instructorProfile?: InstructorProfile;
  private _socials: UserSocials[];
  // private _wallet: Wallet;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;

    this._roles =
      Array.isArray(props.roles) && props.roles.length > 0
        ? props.roles
        : [UserRoles.STUDENT];

    this._roleStatus = {
      [UserRoles.STUDENT]: RoleStatus.ACTIVE,
      [UserRoles.INSTRUCTOR]: RoleStatus.ACTIVE,
      [UserRoles.ADMIN]: RoleStatus.ACTIVE,
    };
    if (props.roleStatus) {
      Object.assign(this._roleStatus, props.roleStatus);
    }

    this._status = props.status;
    this._username = props.username;
    this._slug = props.slug;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._avatar = props.avatar;
    this._lastLoginAt = props.lastLoginAt
      ? new Date(props.lastLoginAt)
      : undefined;
    this._profile = props.profile;
    this._instructorProfile = props.instructorProfile;
    this._socials = Array.isArray(props.socials) ? [...props.socials] : [];
    // this._wallet = props.wallet;
    this._createdAt = new Date(props.createdAt);
    this._updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
  }

  static create(props: UserProps) {
    return new User({
      ...props,
      id: props.id,
      roles: props.roles ?? [UserRoles.STUDENT],
      status: props.status ?? UserStatus.VERIFIED,
      // wallet: props.wallet ?? Wallet.createInitial(userId),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static fromPrimitives(props: UserProps): User {
    return new User({
      ...props,
    });
  }

  get id() {
    return this._id;
  }
  get email() {
    return this._email;
  }
  get roles() {
    return [...this._roles];
  }
  get roleStatusMap() {
    return { ...this._roleStatus };
  }
  get status() {
    return this._status;
  }
  get username() {
    return this._username;
  }
  get slug() {
    return this._slug;
  }
  get firstName() {
    return this._firstName;
  }
  get lastName() {
    return this._lastName;
  }
  get avatar() {
    return this._avatar;
  }
  get lastLoginAt() {
    return this._lastLoginAt;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }
  get profile() {
    return this._profile;
  }
  get instructorProfile() {
    return this._instructorProfile;
  }
  get socials() {
    return [...this._socials];
  }
  // get wallet() {
  //   return this._wallet;
  // }

  get fullName() {
    return `${this._firstName ?? ""} ${this._lastName ?? ""}`.trim();
  }

  promoteToInstructor(instructor: InstructorProfile): void {
    if (this._roles.includes(UserRoles.INSTRUCTOR)) return;
    this._roles.push(UserRoles.INSTRUCTOR);
    this._instructorProfile = instructor;
    this._touch();
  }

  isBlocked(): boolean {
    return this._status === UserStatus.BLOCKED;
  }

  isInstructor(): boolean {
    return this._roles.includes(UserRoles.INSTRUCTOR);
  }

  isRoleBlocked(role: UserRoles): boolean {
    return this._roleStatus[role] === RoleStatus.BLOCKED;
  }

  blockAccount(): void {
    this._status = UserStatus.BLOCKED;
    this._touch();
  }

  unblockAccount(): void {
    this._status = UserStatus.ACTIVE;
    this._touch();
  }

  blockRole(role: UserRoles): void {
    if (this._roleStatus[role] !== RoleStatus.BLOCKED) {
      this._roleStatus[role] = RoleStatus.BLOCKED;
      this._touch();
    }
  }

  unblockRole(role: UserRoles): void {
    if (this._roleStatus[role] === RoleStatus.BLOCKED) {
      this._roleStatus[role] = RoleStatus.ACTIVE;
      this._touch();
    }
  }

  activate(): void {
    this._status = UserStatus.ACTIVE;
    this._touch();
  }

  updateStatus(status: UserStatus): void {
    this._status = status;
    this._touch();
  }

  updateRole(role: UserRoles): void {
    if (!this._roles.includes(role)) {
      this._roles.push(role);
    }
    this._touch();
  }

  updateLastLogin(date: Date): void {
    this._lastLoginAt = new Date(date);
  }

  updateBasicData(data: UpdatableUserProps): void {
    if (data.firstName !== undefined) this._firstName = data.firstName;
    if (data.lastName !== undefined) this._lastName = data.lastName;
    if (data.username !== undefined) this._username = data.username;
    if (data.slug !== undefined) this._slug = data.slug;
    if (data.avatar !== undefined) this._avatar = data.avatar;
    this._touch();
  }

  updateInstructorProfile(
    ...args: Parameters<InstructorProfile["update"]>
  ): void {
    this._instructorProfile.update(...args);
    this._touch();
  }

  updateProfile(...args: Parameters<UserProfile["updateProfile"]>): void {
    this._profile?.updateProfile(...args);
    this._touch();
  }

  setUserProfile(profile: UserProfile): void {
    this._profile = profile;
    this._touch();
  }

  setInstructorProfile(profile: InstructorProfile): void {
    this._instructorProfile = profile;
    this._touch();
  }

  setSocials(socials: UserSocials[]): void {
    this._socials = Array.isArray(socials) ? [...socials] : [];
    this._touch();
  }

  private _touch(): void {
    this._updatedAt = new Date();
  }

  toPrimitives(): UserProps {
    return {
      id: this._id,
      email: this._email,
      roles: [...this._roles],
      roleStatus: { ...this._roleStatus },
      status: this._status,
      username: this._username,
      slug: this._slug,
      firstName: this._firstName,
      lastName: this._lastName,
      avatar: this._avatar,
      lastLoginAt: this._lastLoginAt,
      profile: this._profile,
      instructorProfile: this._instructorProfile,
      socials: this._socials ? [...this._socials] : [],
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
    };
  }

  toJSON() {
    return this.toPrimitives();
  }
}

export default User;
