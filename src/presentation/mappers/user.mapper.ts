import {
  InstructorProfileData,
  UserData,
  UserMeta,
  UserProfileData,
  UserSocialsData,
} from "src/infrastructure/grpc/generated/user/types/user_types";
import { UserProfile } from "src/domain/entities/user-profile.entity";
import { InstructorProfile } from "src/domain/entities/instructor-profile.entity";
import { UserSocials } from "src/domain/entities/user-socials.entity";
import User, { UserRoles } from "src/domain/entities/user-entity";
import { InstructorMeta } from "src/infrastructure/grpc/generated/user/types/instructor_types";

export class UserProfileMapper {
  static toGrpcResponse(user: UserProfile): UserProfileData {
    return {
      bio: user.bio,
      country: user.country,
      gender: user.gender,
      city: user.city,
      language: user.language,
      phone: user.phone,
      preference: user.preferences?.toString(),
      website: user.website,
    };
  }
}
export class InstructorProfileMapper {
  static toGrpcResponse(instructor: InstructorProfile): InstructorProfileData {
    return {
      bio: instructor.bio,
      certificate: instructor.certificate,
      experience: instructor.experience,
      expertise: instructor.expertise,
      headline: instructor.headline,
      totalStudents: instructor.totalStudents,
      joinedAt: instructor.joinedAt.toISOString(),
      rating: instructor.rating,
      education: instructor.education,
      tags: instructor.tags.slice(),
      totalCourses: instructor.totalCourses,
      totalRatings: instructor.totalRatings,
    };
  }
}
export class UserSocialsMapper {
  static toGrpcResponse(social: UserSocials): UserSocialsData {
    return {
      profileUrl: social.profileUrl,
      provider: social.provider,
      providerUserUrl: social.providerUserId,
    };
  }
}

export class UserResponseMapper {
  public toGrpcResponse = (user: User): UserData => {
    return {
      email: user.email,
      firstName: user.firstName,
      slug: user.slug,
      username: user.username,
      id: user.id,
      role: UserResponseMapper.getUserRole(user),
      socials: user.socials
        ? user.socials.map((social) => UserSocialsMapper.toGrpcResponse(social))
        : [],
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      instructorProfile: user.instructorProfile
        ? InstructorProfileMapper.toGrpcResponse(user.instructorProfile)
        : undefined,
      lastLogin: user.lastLoginAt?.toISOString(),
      lastName: user.lastName,
      profile: user.profile
        ? UserProfileMapper.toGrpcResponse(user.profile)
        : undefined,
      updatedAt: user.updatedAt.toISOString(),
      roleStatus: user.roleStatusMap,
    };
  };

  static toGrpcMetaResponse = (user: User): UserMeta => {
    return {
      email: user.email,
      updatedAt: user.updatedAt?.toISOString(),
      firstName: user.firstName,
      id: user.id,
      role: UserResponseMapper.getUserRole(user),
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLoginAt?.toISOString(),
      lastName: user.lastName,
      bio: user.profile?.bio,
      city: user.profile?.city,
      country: user.profile?.country,
      gender: user.profile?.gender,
      phone: user.profile?.phone,
      roleStatus: user.roleStatusMap,
    };
  };

  static toGrpcInstructorMetaResponse = (user: User): InstructorMeta => {
    return {
      email: user.email,
      updatedAt: user.updatedAt?.toISOString(),
      slug: user.slug,
      username: user.username,
      id: user.id,
      role: UserResponseMapper.getUserRole(user),
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLoginAt?.toISOString(),
      bio: user.instructorProfile?.bio,
      education: user.instructorProfile?.education,
      experience: user.instructorProfile?.experience,
      expertise: user.instructorProfile?.expertise,
      headline: user.instructorProfile?.headline,
      joinedAt: user.instructorProfile?.joinedAt?.toISOString(),
      language: user.profile?.language,
      rating: user.instructorProfile?.rating,
      tags: user.instructorProfile?.tags.slice(),
      totalCourses: user.instructorProfile?.totalCourses,
      totalRatings: user.instructorProfile?.totalRatings,
      totalStudents: user.instructorProfile?.totalStudents,
      website: user.profile?.website,
      roleStatus: user.roleStatusMap,
    };
  };

  static getUserRole = (user: User) =>
    user.isInstructor() ? UserRoles.INSTRUCTOR : UserRoles.STUDENT;
}
