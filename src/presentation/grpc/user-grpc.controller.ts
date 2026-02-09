import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

import { DomainException } from "src/domain/exceptions";
import GetInstructorsUseCaseImpl from "src/application/use-cases/user/get-instructors.use-case";
import GetUsersUseCaseImpl from "src/application/use-cases/user/get-users.usecase";
import CurrentUserUseCaseImpl from "src/application/use-cases/user/current-user.usecase";
import GetUserUseCaseImpl from "src/application/use-cases/user/get-user.use-case";
import UpdateUserUseCaseImpl from "src/application/use-cases/user/update-user.use-case";
import GetEmailsUseCaseImpl from "src/application/use-cases/user/get-emails.use-case";
import CheckEmailExistUseCaseImpl from "src/application/use-cases/user/email-exist.use-case";
import BlockUserUseCaseImpl from "src/application/use-cases/user/block-user.use-case";
import UnBlockUserUserCaseImpl from "src/application/use-cases/user/unblock-user.use-case";
import {
  GetCurrentUserRequest,
  GetCurrentUserResponse,
  GetUserRequest,
  GetUserResponse,
  GetUserEmailsRequest,
  GetUserEmailsResponse,
  CheckUserByEmailRequest,
  CheckUserByEmailResponse,
  BlockUserRequest,
  BlockUserResponse,
  UnBlockUserRequest,
  UnBlockUserResponse,
  UpdateUserDetailsRequest,
  UpdateUserDetailsResponse,
  UserData,
  ListUsersResponse,
  EmailExist,
} from "src/infrastructure/grpc/generated/user/types/user_types";
import User from "src/domain/entities/user.entity";
import RegisterInstructorUseCase from "src/application/use-cases/user/register-instructor.usecase";
import GetUsersByIdsDto from "./dtos/get-users-by-ids.dto";
import GetUsersByIdsUseCase from "src/application/use-cases/user/get-users-by-ids.usecase";
import GetInstructorByUsernameUseCaseImpl from "src/application/use-cases/user/get-instructor-by-username.use-case";
import GetUsersDto from "./dtos/get-users.dto";
import {
  Empty,
  Error,
  PaginationResponse,
} from "src/infrastructure/grpc/generated/user/common";
import {
  GetInstructorByNameRequest,
  GetInstructorByNameResponse,
  GetInstructorsRequest,
  ListInstructorsRequest,
  ListInstructorsResponse,
  RegisterInstructorRequest,
  RegisterInstructorResponse,
} from "src/infrastructure/grpc/generated/user/types/instructor_types";
import ListInstructorsOfStudentUseCase from "src/application/use-cases/user/list-instructors-of-student.use-case";
import ListStudentsOfInstructorUseCase from "src/application/use-cases/user/list-students-of-instructor.use-case";
import IsStudentOfInstructorUseCase from "src/application/use-cases/user/is-student-of-instructor.use-case";
import {
  IsStudentOfInstructorRequest,
  IsStudentOfInstructorResponse,
  ListInstructorsOfStudentRequest,
  ListStudentsOfInstructorRequest,
} from "src/infrastructure/grpc/generated/user/types/instructor_student";
import {
  GetInstructorsStatsResponse,
  GetUsersStatsResponse,
} from "src/infrastructure/grpc/generated/user/types/stats_types";
import GetUsersStatsUseCase from "src/application/use-cases/user/get-users-stats.use-case";
import GetInstructorsStatsUseCase from "src/application/use-cases/user/get-instructors-stats.use-case";

@Controller()
export class UserGrpcController {
  constructor(
    private readonly getUsersUseCase: GetUsersUseCaseImpl,
    private readonly getUsersByIdsUseCase: GetUsersByIdsUseCase,
    private readonly getInstructorsUseCase: GetInstructorsUseCaseImpl,
    private readonly listInstructorsOfStudentUseCase: ListInstructorsOfStudentUseCase,
    private readonly listStudentsOfInstructorUseCase: ListStudentsOfInstructorUseCase,
    private readonly isStudentOfInstructorUseCase: IsStudentOfInstructorUseCase,
    private readonly getUsersStatsUseCase: GetUsersStatsUseCase,
    private readonly getInstructorsStatsUseCase: GetInstructorsStatsUseCase,
    private readonly currentUserUseCase: CurrentUserUseCaseImpl,
    private readonly detailedUserUseCase: GetUserUseCaseImpl,
    private readonly getInstructorByUsernameUseCase: GetInstructorByUsernameUseCaseImpl,
    private readonly updateUserUseCase: UpdateUserUseCaseImpl,
    private readonly getEmailsUseCase: GetEmailsUseCaseImpl,
    private readonly checkEmailExistUseCase: CheckEmailExistUseCaseImpl,
    private readonly blockUserUseCase: BlockUserUseCaseImpl,
    private readonly unBlockUserUseCase: UnBlockUserUserCaseImpl,
    private readonly registerInstructorUseCase: RegisterInstructorUseCase,
    private readonly tracer: TracingService,
    private readonly logger: LoggingService,
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.errorCode,
      message: error.message,
      details:
        "serializeError" in error && typeof error.serializeError === "function"
          ? error.serializeError()
          : [{ message: error.message }],
    };
  }

  @GrpcMethod("UserService", "ListUsers")
  async listUsers(data: GetUsersDto): Promise<ListUsersResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.listUsers",
        async (span) => {
          const { page, pageSize } = data.pagination!;

          span.setAttributes({ page, pageSize });
          this.logger.info("Handling `ListUsers` request ", {
            ctx: UserGrpcController.name,
          });

          const { total, users } = await this.getUsersUseCase.execute(data);

          const paginationResponse: PaginationResponse = {
            totalItems: total,
          };
          this.logger.info("ListUsers request has been successfully completed");

          return {
            users: {
              users: users.map((user) => user.toGrpcMetaResponse()),
              pagination: paginationResponse,
            },
          };
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `GetUsers`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }
  @GrpcMethod("UserService", "ListUsersByIds")
  async getUsersByIds(data: GetUsersByIdsDto): Promise<ListUsersResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.getUsersByIds",
        async (span) => {
          // const { page, pageSize } = data.pagination!;

          // span.setAttributes({ page, pageSize });
          this.logger.info("Handling `getUsersByIds` request ", {
            ctx: UserGrpcController.name,
          });

          const { users } = await this.getUsersByIdsUseCase.execute(data);

          const paginationResponse: PaginationResponse = {
            totalItems: users.length,
          };
          this.logger.info(
            "getUsersByIds request has been successfully completed",
          );

          return {
            users: {
              users: users.map((user) => user.toGrpcResponse()),
              pagination: paginationResponse,
            },
          };
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `getUsersByIds`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }
  @GrpcMethod("UserService", "ListInstructors")
  async listInstructors(
    data: ListInstructorsRequest,
  ): Promise<ListInstructorsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.listInstructors",
        async (span) => {
          const { page, pageSize } = data.pagination!;

          span.setAttributes({ page, pageSize });
          this.logger.info("Handling `ListInstructors` request ", {
            ctx: UserGrpcController.name,
          });

          const { total, instructors } =
            await this.getInstructorsUseCase.execute(data);

          const paginationResponse: PaginationResponse = {
            totalItems: total,
          };
          this.logger.info(
            "ListInstructors request has been successfully completed",
          );

          return {
            instructors: {
              instructors: instructors.map((instructor) =>
                instructor.toGrpcInstructorMetaResponse(),
              ),
              pagination: paginationResponse,
            },
          };
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `ListInstructors`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }

  @GrpcMethod("UserService", "GetCurrentUser")
  async getCurrentUser(
    data: GetCurrentUserRequest,
  ): Promise<GetCurrentUserResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.getCurrentUser",
        async (span) => {
          this.logger.info("Handling `getCurrentUser` request ", {
            ctx: UserGrpcController.name,
          });

          const { userId } = data;
          span.setAttributes({ userId });

          const user = await this.currentUserUseCase.execute({ userId });

          this.logger.info(
            "GeCurrentUser request has been successfully completed",
          );

          return {
            user: user.toGrpcResponse(),
          } as GetCurrentUserResponse;
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `getCurrentUser`", {
        error,
      });

      return { error: this.createErrorResponse(error) };
    }
  }

  @GrpcMethod("UserService", "GetUserEmails")
  async getUserEmails(
    data: GetUserEmailsRequest,
  ): Promise<GetUserEmailsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.getUsersEmails",
        async () => {
          this.logger.info("Handling `GetUsersEmails` request ", {
            ctx: UserGrpcController.name,
          });

          // const { page, pageSize } = pagination!;
          // const userDto = new CurrentUserDto();
          // userDto.userId = userId;

          // await validate input
          // await validateDto(userDto);

          const userEmails = await this.getEmailsUseCase.execute();
          // const userResponse = new ResponseMapper<{ email: string }, { email: string }>({
          //   fields: {
          //     email: 'email',
          //   },
          // }).toResponseList(userEmails);

          this.logger.info(
            "GetUsersEmails request has been successfully completed",
          );
          return { success: { emails: userEmails } };
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `GetUsersEmails`", {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("UserService", "CheckUserEmailExist")
  async checkUserEmailExist(
    data: CheckUserByEmailRequest,
  ): Promise<CheckUserByEmailResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.checkUserEmailExist",
        async (span) => {
          const { email } = data;

          span.setAttributes({ email });
          this.logger.info("Handling `GetUsers` request ", {
            ctx: UserGrpcController.name,
          });

          const emailExist = await this.checkEmailExistUseCase.execute({
            email,
          });

          this.logger.info(
            "CheckEmailsExists request has been successfully completed",
          );
          return { response: { exists: emailExist, error: "None" } };
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `CheckEmailExists`", {
        error,
      });

      if (error instanceof DomainException) {
        return { error: this.createErrorResponse(error) };
      }
      throw error;
    }
  }

  @GrpcMethod("UserService", "BlockUser")
  async blockUser(data: BlockUserRequest): Promise<BlockUserResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.blockUser",
        async (span) => {
          const { userId } = data;

          span.setAttributes({ userId });
          this.logger.info("Handling `BlockUser` request ", {
            ctx: UserGrpcController.name,
          });

          const blockedUser = await this.blockUserUseCase.execute({ userId });

          this.logger.info("BlockUser request has been successfully completed");
          return { success: { updated: !!blockedUser } };
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `BlockUser`", {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("UserService", "GetInstructorByName")
  async getUserByUsername(
    data: GetInstructorByNameRequest,
  ): Promise<GetInstructorByNameResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.GetInstructorByName",
        async (span) => {
          const { username } = data;

          span.setAttributes({ username });
          this.logger.info("Handling `GetInstructorByName` request ", {
            ctx: UserGrpcController.name,
          });

          const user = await this.getInstructorByUsernameUseCase.execute({
            username,
          });

          this.logger.info(
            "GetInstructorByName request has been successfully completed",
          );
          return { user: user.toGrpcResponse() } as GetUserResponse;
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `GetInstructorByName`", {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("UserService", "GetUser")
  async getUser(data: GetUserRequest): Promise<GetUserResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.getUser",
        async (span) => {
          const { userId } = data;

          span.setAttributes({ userId });
          this.logger.info("Handling `GetUser` request ", {
            ctx: UserGrpcController.name,
          });

          const user = await this.detailedUserUseCase.execute({
            userId,
          });

          this.logger.info("GetUser request has been successfully completed");
          return { user: user.toGrpcResponse() } as GetUserResponse;
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `getUser`", {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("UserService", "UnBlockUser")
  async unBlockUser(data: UnBlockUserRequest): Promise<UnBlockUserResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.unblockUser",
        async (span) => {
          const { userId } = data;

          span.setAttributes({ userId });
          this.logger.info("Handling `UnBlockUser` request ", {
            ctx: UserGrpcController.name,
          });

          const blockedUser = await this.unBlockUserUseCase.execute({ userId });

          this.logger.info(
            "UnBlockUser request has been successfully completed",
          );
          return { success: { updated: !!blockedUser } };
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `unBlockUser`", {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("UserService", "UpdateUserDetails")
  async updateUserDetails(
    data: UpdateUserDetailsRequest,
  ): Promise<UpdateUserDetailsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.updateUserDetails",
        async (span) => {
          const { userId } = data!;

          this.logger.info("udpate data " + JSON.stringify(data, null, 2));

          span.setAttributes({ userId });
          this.logger.info("Handling `UpdateUserDetails` request ", {
            ctx: UserGrpcController.name,
          });

          const updatedUser = await this.updateUserUseCase.execute(data);

          this.logger.info(
            "updateUserDetails request has been successfully completed",
          );
          return {
            user: updatedUser.toGrpcResponse(),
          } as UpdateUserDetailsResponse;
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `UpdateUserDetails`", {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("UserService", "RegisterInstructor")
  async registerInstructor(
    data: RegisterInstructorRequest,
  ): Promise<RegisterInstructorResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.registerInstructor",
        async (span) => {
          const { userId } = data!;

          span.setAttributes({ userId });
          this.logger.info("Handling `RegisterInstructor` request ", {
            ctx: UserGrpcController.name,
          });

          const updatedUser =
            await this.registerInstructorUseCase.execute(data);

          this.logger.info(
            "registerInstructor request has been successfully completed",
          );
          return {
            success: {
              user: updatedUser.toGrpcResponse(),
            },
          } as RegisterInstructorResponse;
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `RegisterInstructor`", {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("UserService", "ListInstructorsOfStudent")
  async listInstructorsOfStudent(
    data: ListInstructorsOfStudentRequest,
  ): Promise<ListInstructorsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.listInstructorsOfStudent",
        async (span) => {
          const { page, pageSize } = data.pagination!;

          span.setAttributes({ page, pageSize });
          this.logger.info("Handling `ListInstructorsOfStudent` request ", {
            ctx: UserGrpcController.name,
          });

          const { total, instructors } =
            await this.listInstructorsOfStudentUseCase.execute(data);

          const paginationResponse: PaginationResponse = {
            totalItems: total,
          };
          this.logger.info(
            "ListInstructorsOfStudent request has been successfully completed",
          );

          return {
            instructors: {
              instructors: instructors.map((instructor) =>
                instructor.toGrpcInstructorMetaResponse(),
              ),
              pagination: paginationResponse,
            },
          };
        },
      );
    } catch (error) {
      this.logger.error(
        "Error processing gRPC request `ListInstructorsOfStudent`",
        {
          error,
        },
      );
      return { error: this.createErrorResponse(error) };
    }
  }

  @GrpcMethod("UserService", "ListStudentsOfInstructor")
  async listStudentsOfInstructor(
    data: ListStudentsOfInstructorRequest,
  ): Promise<ListUsersResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.listStudentsOfInstructor",
        async (span) => {
          const { page, pageSize } = data.pagination!;

          span.setAttributes({ page, pageSize });
          this.logger.info("Handling `ListStudentsOfInstructor` request ", {
            ctx: UserGrpcController.name,
          });

          const { total, students } =
            await this.listStudentsOfInstructorUseCase.execute(data);

          const paginationResponse: PaginationResponse = {
            totalItems: total,
          };
          this.logger.info(
            "ListStudentsOfInstructor request has been successfully completed",
          );

          return {
            users: {
              users: students.map((student) => student.toGrpcMetaResponse()),
              pagination: paginationResponse,
            },
          };
        },
      );
    } catch (error) {
      this.logger.error(
        "Error processing gRPC request `ListStudentsOfInstructor`",
        {
          error,
        },
      );
      return { error: this.createErrorResponse(error) };
    }
  }

  @GrpcMethod("UserService", "IsStudentOfInstructor")
  async isStudentOfInstructor(
    data: IsStudentOfInstructorRequest,
  ): Promise<IsStudentOfInstructorResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.isStudentOfInstructor",
        async (span) => {
          this.logger.info("Handling `IsStudentOfInstructor` request ", {
            ctx: UserGrpcController.name,
          });

          const { isStudent } =
            await this.isStudentOfInstructorUseCase.execute(data);

          this.logger.info(
            "IsStudentOfInstructor request has been successfully completed",
          );

          return {
            success: {
              isStudent,
            },
          };
        },
      );
    } catch (error) {
      this.logger.error(
        "Error processing gRPC request `IsStudentOfInstructor`",
        {
          error,
        },
      );
      return { error: this.createErrorResponse(error) };
    }
  }
  @GrpcMethod("UserService", "GetUsersStats")
  async getUsersStats(data: Empty): Promise<GetUsersStatsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.getUsersStats",
        async (span) => {
          this.logger.info("Handling `GetUsersStats` request ", {
            ctx: UserGrpcController.name,
          });

          const stats = await this.getUsersStatsUseCase.execute();

          this.logger.info(
            "GetUsersStats request has been successfully completed",
          );

          return {
            success: stats,
          };
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `GetUsersStats`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }
  @GrpcMethod("UserService", "GetInstructorsStats")
  async getInstructorsStats(data: Empty): Promise<GetInstructorsStatsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "UserGrpcController.getInstructorsStats",
        async (span) => {
          this.logger.info("Handling `GetInstructorsStats` request ", {
            ctx: UserGrpcController.name,
          });

          const stats = await this.getInstructorsStatsUseCase.execute();

          this.logger.info(
            "GetInstructorsStats request has been successfully completed",
          );

          return {
            success: stats,
          };
        },
      );
    } catch (error) {
      this.logger.error("Error processing gRPC request `GetUsersStats`", {
        error,
      });
      return { error: this.createErrorResponse(error) };
    }
  }

  // private mapToUserResponse(user: User): UserData {
  //   return {
  //     email: user.email,
  //     firstName: user.firstName,
  //     id: user.id,
  //     role: user.role,
  //     socials: user.socials
  //       ? user.socials.map((social) => ({
  //           profileUrl: social.profileUrl,
  //           provider: social.provider,
  //           providerUserUrl: social.providerUserId,
  //         }))
  //       : [],
  //     status: user.status,
  //     avatar: user.avatar,
  //     createdAt: user.createdAt?.toISOString?.(),
  //     instructorProfile: user.instructorProfile
  //       ? {
  //           rating: user.instructorProfile.rating,
  //           tags: user.instructorProfile.tags,
  //           totalCourses: user.instructorProfile.totalCourses,
  //           totalRatings: user.instructorProfile.totalRatings,
  //           totalStudents: user.instructorProfile.totalStudents,
  //           bio: user.instructorProfile.bio,
  //           certificate: user.instructorProfile.certificate,
  //           experience: user.instructorProfile.experience,
  //           expertise: user.instructorProfile.expertise,
  //           headline: user.instructorProfile.headline,
  //         }
  //       : undefined,
  //     lastLogin: user.lastLogin?.toISOString?.(),
  //     lastName: user.lastName,
  //     profile: user.profile
  //       ? {
  //           bio: user.profile.bio,
  //           city: user.profile.city,
  //           country: user.profile.country,
  //           gender: user.profile.gender,
  //           language: user.profile.language,
  //           phone: user.profile.phone,
  //           website: user.profile.website,
  //         }
  //       : undefined,
  //     updatedAt: user.updatedAt?.toISOString?.(),
  //   };
  // return new ResponseMapper<typeof user, UserData>({
  //   fields: {
  //     id: (user) => user.id,
  //     avatar: (user) => user.avatar,
  //     email: (user) => user.email,
  //     firstName: (user) => user.firstName,
  //     lastName: (user) => user.lastName,
  //     lastLogin: (user) => user.lastLogin,
  //     profile: (user) => user.profile,
  //     instructorProfile: (user) => user.instructorProfile,
  //     role: (user) => user.role,
  //     status: (user) => user.status,
  //     socials: (user) => user.socials,
  //     createdAt: (user) => user.createdAt,
  //     updatedAt: (user) => user.updatedAt,
  //     // email: "getEmail",
  //     // avatar: "getAvatar",
  //     // biography: "getBio",
  //     // firstName: "getFirstName",
  //     // lastName: "getLastName",
  //     // role: "getRole",
  //     // createdAt: "getCreatedAt",
  //     // facebook: "getFacebook",
  //     // headline: "getHeadline",
  //     // instagram: "getInstagram",
  //     // language: "getLanguage",
  //     // linkedin: "getLinkedin",
  //     // phone: "getPhone",
  //     // status: "getStatus",
  //     // updatedAt: "getUpdatedAt",
  //     // userId: "getId",
  //     // website: "getWebsite",
  //     // city: "getCity",
  //     // country: "getCountry",
  //     // education: "getEducation",
  //     // experience: "getExperience",
  //     // expertise: "getExpertise",
  //     // extraEmail: "getAlternativeEmail",
  //   },
  // }).toResponse(user);
}
// }
