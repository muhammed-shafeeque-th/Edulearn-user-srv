import { v4 as uuidV4 } from "uuid";

export type SocialProvider =
  | "facebook"
  | "twitter"
  | "google"
  | "linkedin"
  | "github"
  | "other";

export interface UserSocialsProps {
  id: string;
  userId: string;
  provider: SocialProvider;
  profileUrl: string;
  providerUserId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserSocials {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _provider: SocialProvider;
  private readonly _profileUrl: string;
  private readonly _providerUserId?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserSocialsProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._provider = props.provider;
    this._profileUrl = props.profileUrl;
    this._providerUserId = props.providerUserId;
    this._createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this._updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
  }

  static create(
    props: Omit<UserSocialsProps, "id" | "createdAt" | "updatedAt">,
  ): UserSocials {
    return new UserSocials({
      ...props,
      id: uuidV4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPrimitives(props: UserSocialsProps): UserSocials {
    return new UserSocials(props);
  }

  get id(): string {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }
  get provider(): SocialProvider {
    return this._provider;
  }
  get profileUrl(): string {
    return this._profileUrl;
  }
  get providerUserId(): string | undefined {
    return this._providerUserId;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  toPrimitives(): UserSocialsProps {
    return {
      id: this._id,
      userId: this._userId,
      provider: this._provider,
      profileUrl: this._profileUrl,
      providerUserId: this._providerUserId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
