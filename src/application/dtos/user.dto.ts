import {
  InstructorProfileData,
  UserData,
  UserMeta,
  UserProfileData,
  UserSocialsData,
} from "src/infrastructure/grpc/generated/user/types/user_types";
import { Gender, UserProfile } from "src/domain/entities/user-profile.entity";
import { InstructorProfile } from "src/domain/entities/instructor-profile.entity";
import {
  SocialProvider,
  UserSocials,
} from "src/domain/entities/user-socials.entity";
import User, { UserRoles, UserStatus } from "src/domain/entities/user-entity";
import { InstructorMeta } from "src/infrastructure/grpc/generated/user/types/instructor_types";

export class UserProfileDto {
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

  static fromDomain(user: UserProfile): UserProfileDto {
    const dto = new UserProfileDto();
    dto.createdAt = user.createdAt;
    dto.id = user.id;
    dto.city = user.city;
    dto.bio = user.bio;
    dto.preferences = user.preferences;
    dto.website = user.website;
    dto.country = user.country;
    dto.gender = user.gender;
    dto.language = user.language;
    dto.phone = user.phone;
    dto.preferences = user.preferences;
    dto.userId = user.userId;
    dto.updatedAt = user.updatedAt;
    dto.userId = user.userId;

    return dto;
  }
  public toGrpcResponse(): UserProfileData {
    return {
      bio: this.bio,
      country: this.country,
      gender: this.gender,
      city: this.city,
      language: this.language,
      phone: this.phone,
      preference: this.preferences?.toString(),
      website: this.website,

    };
  }
}
export class InstructorProfileDto {
  id: string;
  userId: string;
  bio?: string;
  headline?: string;
  experience?: string;
  certificate?: string;
  expertise?: string;
  education?: string;
  joinedAt: Date;
  tags?: ReadonlyArray<string>;
  rating?: number;
  totalRatings?: number;
  totalCourses?: number;
  totalStudents?: number;
  preferences?: Record<string, string>;

  static fromDomain(user: InstructorProfile): InstructorProfileDto {
    const dto = new InstructorProfileDto();
    dto.bio = user.bio;
    dto.certificate = user.certificate;
    dto.experience = user.experience;
    dto.expertise = user.expertise;
    dto.headline = user.headline;
    dto.id = user.id;
    dto.joinedAt = user.joinedAt;
    dto.preferences = user.preferences;
    dto.rating = user.rating;
    dto.tags = user.tags;
    dto.totalCourses = user.totalCourses;
    dto.totalRatings = user.totalRatings;

    return dto;
  }
  public toGrpcResponse(): InstructorProfileData {
    return {
      bio: this.bio,
      certificate: this.certificate,
      experience: this.experience,
      expertise: this.expertise,
      headline: this.headline,
      totalStudents: this.totalStudents,
      joinedAt: this.joinedAt.toISOString(),
      rating: this.rating,
      education: this.education,
      tags: this.tags.slice(),
      totalCourses: this.totalCourses,
      totalRatings: this.totalRatings,
    };
  }
}
export class UserSocialsDto {
  id: string;
  userId: string;
  provider: SocialProvider;
  profileUrl: string;
  providerUserId?: string;
  createdAt?: Date;
  updatedAt?: Date;

  static fromDomain(user: UserSocials): UserSocialsDto {
    const dto = new UserSocialsDto();
    dto.createdAt = user.createdAt;
    dto.id = user.id;
    dto.profileUrl = user.profileUrl;
    dto.provider = user.provider;
    dto.providerUserId = user.providerUserId;
    dto.updatedAt = user.updatedAt;
    dto.userId = user.userId;

    return dto;
  }
  public toGrpcResponse(): UserSocialsData {
    return {
      profileUrl: this.profileUrl,
      provider: this.provider,
      providerUserUrl: this.providerUserId,
    };
  }
}

export class UserDto {
  id: string;
  email: string;
  role: UserRoles;
  status: UserStatus;
  username?: string;
  slug?: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
  lastLoginAt?: Date | undefined;
  profile?: UserProfileDto;
  instructorProfile?: InstructorProfileDto;
  socials?: UserSocialsDto[];
  createdAt: Date;
  updatedAt?: Date;

  static fromDomain(user: User): UserDto {
    const dto = new UserDto();
    dto.status = user.status;
    dto.avatar = user.avatar;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    dto.status = user.status;
    dto.username = user.username;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.id = user.id;
    dto.lastLoginAt = user.lastLoginAt;
    dto.lastName = user.lastName;
    dto.role = user.role;
    dto.slug = user.slug;
    dto.profile = user.profile ? UserProfileDto.fromDomain(user.profile) : undefined;
    dto.socials = user.socials.map(UserSocialsDto.fromDomain);
    dto.instructorProfile = user.instructorProfile ? InstructorProfileDto.fromDomain(user.instructorProfile) : undefined;

    return dto;
  }

  public toGrpcResponse = (): UserData => {
    return {
      email: this.email,
      firstName: this.firstName,
      slug: this.slug,
      username: this.username,
      id: this.id,
      role: this.role,
      socials: this.socials
        ? this.socials.map((social) => social.toGrpcResponse())
        : [],
      status: this.status,
      avatar: this.avatar,
      createdAt: this.createdAt.toISOString(),
      instructorProfile: this.instructorProfile
        ? this.instructorProfile.toGrpcResponse()
        : undefined,
      lastLogin: this.lastLoginAt?.toISOString(),
      lastName: this.lastName,
      profile: this.profile
        ? this.profile.toGrpcResponse()
        : undefined,
      updatedAt: this.updatedAt.toISOString(),
    };
  };
  
  public toGrpcMetaResponse = (): UserMeta => {
    return {
      email: this.email,
      updatedAt: this.updatedAt?.toISOString(),
      firstName: this.firstName,
      id: this.id,
      role: this.role,
      status: this.status,
      avatar: this.avatar,
      createdAt: this.createdAt.toISOString(),
      lastLogin: this.lastLoginAt?.toISOString(),
      lastName: this.lastName,
      bio: this.profile?.bio,
      city: this.profile?.city,
      country: this.profile?.country,
      gender: this.profile?.gender,
      phone: this.profile?.phone,
      

    };
  };
  
  public toGrpcInstructorMetaResponse = (): InstructorMeta => {
    return {
      email: this.email,
      updatedAt: this.updatedAt?.toISOString(),
      slug: this.slug,
      username: this.username,
      id: this.id,
      role: this.role,
      status: this.status,
      avatar: this.avatar,
      createdAt: this.createdAt.toISOString(),
      lastLogin: this.lastLoginAt?.toISOString(),
      bio: this.instructorProfile.bio,
      education: this.instructorProfile.education,
      experience: this.instructorProfile.experience,
      expertise: this.instructorProfile.expertise,
      headline: this.instructorProfile.headline,
      joinedAt: this.instructorProfile.joinedAt?.toISOString(),
      language: this.profile.language,
      rating: this.instructorProfile.rating,
      tags: this.instructorProfile.tags.slice(),
      totalCourses: this.instructorProfile.totalCourses,
      totalRatings: this.instructorProfile.totalRatings,
      totalStudents: this.instructorProfile.totalStudents,
      website: this.profile.website,

    };
  };



}
