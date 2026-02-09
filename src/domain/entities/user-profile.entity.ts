import { v4 as uuidV4 } from "uuid";

export type Gender = "male" | "female" | "other";

export interface UserProfileProps {
  id: string;
  userId: string;
  bio?: string;
  phone?: string;
  country?: string;
  city?: string;
  gender?: Gender;
  language?: string;
  website?: string;
  preferences?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserProfile {
  private readonly _id: string;
  private readonly _userId: string;
  private _bio?: string;
  private _phone?: string;
  private _country?: string;
  private _city?: string;
  private _gender?: Gender;
  private _language?: string;
  private _website?: string;
  private _preferences: Record<string, string>;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProfileProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._bio = props.bio;
    this._phone = props.phone;
    this._country = props.country;
    this._city = props.city;
    this._gender = props.gender;
    this._language = props.language;
    this._website = props.website;
    this._preferences = props.preferences ? { ...props.preferences } : {};
    this._createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this._updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
  }

  static create(
    props: Omit<UserProfileProps, "id" | "createdAt" | "updatedAt">,
  ): UserProfile {
    return new UserProfile({
      ...props,
      id: uuidV4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPrimitives(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  get id(): string {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }
  get bio(): string | undefined {
    return this._bio;
  }
  get phone(): string | undefined {
    return this._phone;
  }
  get country(): string | undefined {
    return this._country;
  }
  get city(): string | undefined {
    return this._city;
  }
  get gender(): Gender | undefined {
    return this._gender;
  }
  get language(): string | undefined {
    return this._language;
  }
  get website(): string | undefined {
    return this._website;
  }
  get preferences(): Readonly<Record<string, string>> {
    return { ...this._preferences };
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateProfile(data: {
    biography?: string;
    phone?: string;
    country?: string;
    city?: string;
    gender?: Gender;
    language?: string;
    website?: string;
    preferences?: Record<string, string>;
  }): void {
    if (typeof data.biography !== "undefined") this._bio = data.biography;
    if (typeof data.phone !== "undefined") this._phone = data.phone;
    if (typeof data.country !== "undefined") this._country = data.country;
    if (typeof data.city !== "undefined") this._city = data.city;
    if (typeof data.gender !== "undefined") this._gender = data.gender;
    if (typeof data.language !== "undefined") this._language = data.language;
    if (typeof data.website !== "undefined") this._website = data.website;
    if (typeof data.preferences !== "undefined")
      this._preferences = { ...data.preferences };
    this._touch();
  }

  public updatePreferences(preferences: Record<string, string>) {
    this._preferences = { ...preferences };
    this._touch();
  }

  private _touch() {
    this._updatedAt = new Date();
  }

  public equals(other: UserProfile): boolean {
    return (
      this._id === other.id &&
      this._userId === other.userId &&
      this._bio === other.bio &&
      this._phone === other.phone &&
      this._country === other.country &&
      this._city === other.city &&
      this._gender === other.gender &&
      this._language === other.language &&
      this._website === other.website &&
      JSON.stringify(this._preferences) === JSON.stringify(other.preferences)
    );
  }

  toPrimitives(): UserProfileProps {
    return {
      id: this._id,
      userId: this._userId,
      bio: this._bio,
      phone: this._phone,
      country: this._country,
      city: this._city,
      gender: this._gender,
      language: this._language,
      website: this._website,
      preferences: { ...this._preferences },
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
    };
  }
}
