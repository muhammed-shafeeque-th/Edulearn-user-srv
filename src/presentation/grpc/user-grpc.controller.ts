import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

import { IGetInstructorsUseCase } from "@/application/use-cases/profile/interfaces/get-instructors.interface";
import { IGetUsersUseCase } from "@/application/use-cases/profile/interfaces/get-users.inteface";
import { ICurrentUserUseCase } from "@/application/use-cases/profile/interfaces/current-user.interface";
import { IGetUserUseCase } from "@/application/use-cases/profile/interfaces/get-user.interface";
import { IUpdateUserUseCase } from "@/application/use-cases/profile/interfaces/update-user.interface";
import { IGetAllEmailsUseCase } from "@/application/use-cases/profile/interfaces/get-emails.interface";
import { ICheckEmailExistUseCase } from "@/application/use-cases/profile/interfaces/email-exist.interface";
import { IBlockUserAccountUseCase } from "@/application/use-cases/profile/interfaces/block-user-account.interface";
import { IUnBlockUserAccountUseCase } from "@/application/use-cases/profile/interfaces/unblock-user-account.interface";
import { IBlockInstructorRoleUseCase } from "@/application/use-cases/profile/interfaces/block-instructor.interface";
import { IUnBlockInstructorRoleUseCase } from "@/application/use-cases/profile/interfaces/unblock-instructor.interface";
import {
  GetCurrentUserRequest,
  GetCurrentUserResponse,
  GetUserRequest,
  GetUserResponse,
  GetUserEmailsResponse,
  CheckUserByEmailRequest,
  CheckUserByEmailResponse,
  BlockAccountRequest,
  BlockAccountResponse,
  UnBlockAccountRequest,
  UnBlockAccountResponse,
  UpdateUserDetailsRequest,
  UpdateUserDetailsResponse,
  ListUsersResponse,
} from "src/infrastructure/grpc/generated/user/types/user_types";
import { IRegisterInstructorUseCase } from "@/application/use-cases/profile/interfaces/register-instructor.interface";
import { IGetUsersByIdsUseCase } from "@/application/use-cases/profile/interfaces/get-users-by-ids.interface";
import { IGetInstructorByUsernameUseCase } from "@/application/use-cases/profile/interfaces/get-instructor-by-username.interface";
import {
  Empty,
  PaginationResponse,
} from "src/infrastructure/grpc/generated/user/common";
import {
  BlockInstructorRequest,
  BlockInstructorResponse,
  GetInstructorByNameRequest,
  GetInstructorByNameResponse,
  ListInstructorsRequest,
  ListInstructorsResponse,
  RegisterInstructorRequest,
  RegisterInstructorResponse,
  UnBlockInstructorRequest,
  UnBlockInstructorResponse,
} from "src/infrastructure/grpc/generated/user/types/instructor_types";
import { IListInstructorsOfStudentUseCase } from "@/application/use-cases/profile/interfaces/list-instructors-of-student.inteface";
import { IListStudentsOfInstructorUseCase } from "@/application/use-cases/profile/interfaces/list-students-of-instructor.inteface";
import { IIsStudentOfInstructorUseCase } from "@/application/use-cases/profile/interfaces/is-student-of-instructor.interface";
import {
  IsStudentOfInstructorRequest,
  IsStudentOfInstructorResponse,
  ListInstructorsOfStudentRequest,
  ListStudentsOfInstructorRequest,
} from "src/infrastructure/grpc/generated/user/types/instructor_student";
import {
  GetInstructorsGrowthTrendRequest,
  GetInstructorsGrowthTrendResponse,
  GetInstructorsStatsResponse,
  GetUsersGrowthTrendRequest,
  GetUsersGrowthTrendResponse,
  GetUsersStatsResponse,
} from "src/infrastructure/grpc/generated/user/types/stats_types";
import { IGetUsersStatsUseCase } from "@/application/use-cases/profile/interfaces/get-users-stats.interface";
import { IGetInstructorsStatsUseCase } from "@/application/use-cases/profile/interfaces/get-instructors-stats.interface";
import { IGetUsersGrowthTrendUseCase } from "@/application/use-cases/profile/interfaces/get-users-growth-trend.inteface";
import { IGetInstructorsGrowthTrendUseCase } from "@/application/use-cases/profile/interfaces/get-instructors-growth-trend.interface";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";
import GetUsersDto from "./input-dtos/get-users.dto";
import GetUsersByIdsDto from "./input-dtos/get-users-by-ids.dto";
import { UserResponseMapper } from "../mappers/user.mapper";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class UserGrpcController {
  constructor(
    private readonly _getUsersUseCase: IGetUsersUseCase,
    private readonly _getUsersByIdsUseCase: IGetUsersByIdsUseCase,
    private readonly _getInstructorsUseCase: IGetInstructorsUseCase,
    private readonly _listInstructorsOfStudentUseCase: IListInstructorsOfStudentUseCase,
    private readonly _listStudentsOfInstructorUseCase: IListStudentsOfInstructorUseCase,
    private readonly _isStudentOfInstructorUseCase: IIsStudentOfInstructorUseCase,
    private readonly _getUsersStatsUseCase: IGetUsersStatsUseCase,
    private readonly _getUsersGrowthTrendUseCase: IGetUsersGrowthTrendUseCase,
    private readonly _getInstructorsStatsUseCase: IGetInstructorsStatsUseCase,
    private readonly _getInstructorsGrowthTrendUseCase: IGetInstructorsGrowthTrendUseCase,
    private readonly _currentUserUseCase: ICurrentUserUseCase,
    private readonly _detailedUserUseCase: IGetUserUseCase,
    private readonly _getInstructorByUsernameUseCase: IGetInstructorByUsernameUseCase,
    private readonly _updateUserUseCase: IUpdateUserUseCase,
    private readonly _getEmailsUseCase: IGetAllEmailsUseCase,
    private readonly _checkEmailExistUseCase: ICheckEmailExistUseCase,
    private readonly _blockUserAccountUseCase: IBlockUserAccountUseCase,
    private readonly _unBlockUserAccountUseCase: IUnBlockUserAccountUseCase,
    private readonly _blockInstructorRoleUseCase: IBlockInstructorRoleUseCase,
    private readonly _unBlockInstructorRoleUseCase: IUnBlockInstructorRoleUseCase,
    private readonly _registerInstructorUseCase: IRegisterInstructorUseCase,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  @GrpcMethod("UserService", "ListUsers")
  async listUsers(data: GetUsersDto): Promise<ListUsersResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.listUsers",
      async (span) => {
        const { page, pageSize } = data.pagination!;

        span.setAttributes({ page, pageSize });
        this._logger.debug("Handling `ListUsers` request ", {
          ctx: UserGrpcController.name,
        });

        const { total, users } = await this._getUsersUseCase.execute(data);

        const paginationResponse: PaginationResponse = {
          totalItems: total,
        };
        this._logger.debug("ListUsers request has been successfully completed");

        return {
          users: {
            users: users.map((user) =>
              UserResponseMapper.toGrpcMetaResponse(user),
            ),
            pagination: paginationResponse,
          },
        };
      },
    );
  }
  @GrpcMethod("UserService", "ListUsersByIds")
  async getUsersByIds(data: GetUsersByIdsDto): Promise<ListUsersResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.getUsersByIds",
      async () => {
        // const { page, pageSize } = data.pagination!;

        // span.setAttributes({ page, pageSize });
        this._logger.debug("Handling `getUsersByIds` request ", {
          ctx: UserGrpcController.name,
        });

        const { users } = await this._getUsersByIdsUseCase.execute(data);

        const paginationResponse: PaginationResponse = {
          totalItems: users.length,
        };
        this._logger.debug(
          "getUsersByIds request has been successfully completed",
        );

        return {
          users: {
            users: users.map((user) =>
              UserResponseMapper.toGrpcMetaResponse(user),
            ),
            pagination: paginationResponse,
          },
        };
      },
    );
  }
  @GrpcMethod("UserService", "ListInstructors")
  async listInstructors(
    data: ListInstructorsRequest,
  ): Promise<ListInstructorsResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.listInstructors",
      async (span) => {
        const { page, pageSize } = data.pagination!;

        span.setAttributes({ page, pageSize });
        this._logger.debug("Handling `ListInstructors` request ", {
          ctx: UserGrpcController.name,
        });

        const { total, instructors } =
          await this._getInstructorsUseCase.execute(data);

        const paginationResponse: PaginationResponse = {
          totalItems: total,
        };
        this._logger.debug(
          "ListInstructors request has been successfully completed",
        );

        return {
          instructors: {
            instructors: instructors.map((instructor) =>
              UserResponseMapper.toGrpcInstructorMetaResponse(instructor),
            ),
            pagination: paginationResponse,
          },
        };
      },
    );
  }

  @GrpcMethod("UserService", "GetCurrentUser")
  async getCurrentUser(
    data: GetCurrentUserRequest,
  ): Promise<GetCurrentUserResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.getCurrentUser",
      async (span) => {
        this._logger.debug("Handling `getCurrentUser` request ", {
          ctx: UserGrpcController.name,
        });

        const { userId } = data;
        span.setAttributes({ userId });

        const user = await this._currentUserUseCase.execute({ userId });

        this._logger.debug(
          "GeCurrentUser request has been successfully completed",
        );

        return {
          user: UserResponseMapper.toGrpcMetaResponse(user),
        } as GetCurrentUserResponse;
      },
    );
  }

  @GrpcMethod("UserService", "GetUserEmails")
  async getUserEmails(): Promise<GetUserEmailsResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.getUsersEmails",
      async () => {
        this._logger.debug("Handling `GetUsersEmails` request ", {
          ctx: UserGrpcController.name,
        });

        // const { page, pageSize } = pagination!;
        // const userDto = new CurrentUserDto();
        // userDto.userId = userId;

        // await validate input
        // await validateDto(userDto);

        const userEmails = await this._getEmailsUseCase.execute();

        this._logger.debug(
          "GetUsersEmails request has been successfully completed",
        );
        return { success: { emails: userEmails } };
      },
    );
  }
  @GrpcMethod("UserService", "CheckUserEmailExist")
  async checkUserEmailExist(
    data: CheckUserByEmailRequest,
  ): Promise<CheckUserByEmailResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.checkUserEmailExist",
      async (span) => {
        const { email } = data;

        span.setAttributes({ email });
        this._logger.debug("Handling `GetUsers` request ", {
          ctx: UserGrpcController.name,
        });

        const emailExist = await this._checkEmailExistUseCase.execute({
          email,
        });

        this._logger.debug(
          "CheckEmailsExists request has been successfully completed",
        );
        return { response: { exists: emailExist, error: "None" } };
      },
    );
  }

  // @GrpcMethod("UserService", "BlockUser")
  // async blockUser(data: BlockUserRequest): Promise<BlockUserResponse> {
  //     return await this._tracer.startActiveSpan(
  //       "UserGrpcController.blockUser",
  //       async (span) => {
  //         const { userId } = data;

  //         span.setAttributes({ userId });
  //         this._logger.debug("Handling `BlockUser` request ", {
  //           ctx: UserGrpcController.name,
  //         });

  //         const blockedUser = await this.blockUserUseCase.execute({ userId });

  //         this._logger.debug("BlockUser request has been successfully completed");
  //         return { success: { updated: !!blockedUser } };
  //       },
  //     );
  //   } catch (error) {
  //     this._logger.error("Error processing gRPC request `BlockUser`", {
  //       error,
  //     });

  //     // if (error instanceof DomainException) {
  //     //   return {
  //     //     error: this.createErrorResponse(error),
  //     //   };
  //     // }
  //     throw error;
  //   }
  // }
  @GrpcMethod("UserService", "GetInstructorByName")
  async getUserByUsername(
    data: GetInstructorByNameRequest,
  ): Promise<GetInstructorByNameResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.GetInstructorByName",
      async (span) => {
        const { username } = data;

        span.setAttributes({ username });
        this._logger.debug("Handling `GetInstructorByName` request ", {
          ctx: UserGrpcController.name,
        });

        const user = await this._getInstructorByUsernameUseCase.execute({
          username,
        });

        this._logger.debug(
          "GetInstructorByName request has been successfully completed",
        );
        return {
          user: UserResponseMapper.toGrpcMetaResponse(user),
        } as GetUserResponse;
      },
    );
  }
  @GrpcMethod("UserService", "GetUser")
  async getUser(data: GetUserRequest): Promise<GetUserResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.getUser",
      async (span) => {
        const { userId } = data;

        span.setAttributes({ userId });
        this._logger.debug("Handling `GetUser` request ", {
          ctx: UserGrpcController.name,
        });

        const user = await this._detailedUserUseCase.execute({
          userId,
        });

        this._logger.debug("GetUser request has been successfully completed");
        return {
          user: UserResponseMapper.toGrpcMetaResponse(user),
        } as GetUserResponse;
      },
    );
  }

  // @GrpcMethod("UserService", "UnBlockUser")
  // async unBlockUser(data: UnBlockUserRequest): Promise<UnBlockUserResponse> {
  //     return await this._tracer.startActiveSpan(
  //       "UserGrpcController.unblockUser",
  //       async (span) => {
  //         const { userId } = data;

  //         span.setAttributes({ userId });
  //         this._logger.debug("Handling `UnBlockUser` request ", {
  //           ctx: UserGrpcController.name,
  //         });

  //         const blockedUser = await this.unBlockUserUseCase.execute({ userId });

  //         this._logger.debug(
  //           "UnBlockUser request has been successfully completed",
  //         );
  //         return { success: { updated: !!blockedUser } };
  //       },
  //     );
  //   } catch (error) {
  //     this._logger.error("Error processing gRPC request `unBlockUser`", {
  //       error,
  //     });

  //     // if (error instanceof DomainException) {
  //     //   return {
  //     //     error: this.createErrorResponse(error),
  //     //   };
  //     // }
  //     throw error;
  //   }
  // }

  @GrpcMethod("UserService", "BlockAccount")
  async blockAccount(data: BlockAccountRequest): Promise<BlockAccountResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.blockAccount",
      async (span) => {
        const { userId } = data;

        span.setAttributes({ userId });
        this._logger.debug("Handling `BlockAccount` request ", {
          ctx: UserGrpcController.name,
        });

        const blockedUser = await this._blockUserAccountUseCase.execute({
          userId,
        });

        this._logger.debug(
          "BlockAccount request has been successfully completed",
        );
        return { success: { updated: !!blockedUser } };
      },
    );
  }

  @GrpcMethod("UserService", "UnBlockAccount")
  async unBlockAccount(
    data: UnBlockAccountRequest,
  ): Promise<UnBlockAccountResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.unBlockAccount",
      async (span) => {
        const { userId } = data;

        span.setAttributes({ userId });
        this._logger.debug("Handling `UnBlockAccount` request ", {
          ctx: UserGrpcController.name,
        });

        const blockedUser = await this._unBlockUserAccountUseCase.execute({
          userId,
        });

        this._logger.debug(
          "UnBlockAccount request has been successfully completed",
        );
        return { success: { updated: !!blockedUser } };
      },
    );
  }

  @GrpcMethod("UserService", "BlockInstructor")
  async blockInstructor(
    data: BlockInstructorRequest,
  ): Promise<BlockInstructorResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.blockInstructor",
      async (span) => {
        const { instructorId } = data;

        span.setAttributes({ instructorId });
        this._logger.debug("Handling `BlockInstructor` request ", {
          ctx: UserGrpcController.name,
        });

        const blockedUser = await this._blockInstructorRoleUseCase.execute({
          instructorId,
        });

        this._logger.debug(
          "BlockInstructor request has been successfully completed",
        );
        return { success: { updated: !!blockedUser } };
      },
    );
  }

  @GrpcMethod("UserService", "UnBlockInstructor")
  async unBlockInstructor(
    data: UnBlockInstructorRequest,
  ): Promise<UnBlockInstructorResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.unBlockInstructor",
      async (span) => {
        const { instructorId } = data;

        span.setAttributes({ instructorId });
        this._logger.debug("Handling `UnBlockInstructor` request ", {
          ctx: UserGrpcController.name,
        });

        const blockedUser = await this._unBlockInstructorRoleUseCase.execute({
          instructorId,
        });

        this._logger.debug(
          "UnBlockInstructor request has been successfully completed",
        );
        return { success: { updated: !!blockedUser } };
      },
    );
  }

  @GrpcMethod("UserService", "UpdateUserDetails")
  async updateUserDetails(
    data: UpdateUserDetailsRequest,
  ): Promise<UpdateUserDetailsResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.updateUserDetails",
      async (span) => {
        const { userId } = data!;

        this._logger.debug("udpate data " + JSON.stringify(data, null, 2));

        span.setAttributes({ userId });
        this._logger.debug("Handling `UpdateUserDetails` request ", {
          ctx: UserGrpcController.name,
        });

        const updatedUser = await this._updateUserUseCase.execute(data);

        this._logger.debug(
          "updateUserDetails request has been successfully completed",
        );
        return {
          user: UserResponseMapper.toGrpcMetaResponse(updatedUser),
        } as UpdateUserDetailsResponse;
      },
    );
  }
  @GrpcMethod("UserService", "RegisterInstructor")
  async registerInstructor(
    data: RegisterInstructorRequest,
  ): Promise<RegisterInstructorResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.registerInstructor",
      async (span) => {
        const { userId } = data!;

        span.setAttributes({ userId });
        this._logger.debug("Handling `RegisterInstructor` request ", {
          ctx: UserGrpcController.name,
        });

        const updatedUser = await this._registerInstructorUseCase.execute(data);

        this._logger.debug(
          "registerInstructor request has been successfully completed",
        );
        return {
          success: {
            user: UserResponseMapper.toGrpcMetaResponse(updatedUser),
          },
        } as RegisterInstructorResponse;
      },
    );
  }

  @GrpcMethod("UserService", "ListInstructorsOfStudent")
  async listInstructorsOfStudent(
    data: ListInstructorsOfStudentRequest,
  ): Promise<ListInstructorsResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.listInstructorsOfStudent",
      async (span) => {
        const { page, pageSize } = data.pagination!;

        span.setAttributes({ page, pageSize });
        this._logger.debug("Handling `ListInstructorsOfStudent` request ", {
          ctx: UserGrpcController.name,
        });

        const { total, instructors } =
          await this._listInstructorsOfStudentUseCase.execute(data);

        console.log(
          "Instructors of student: " +
            JSON.stringify({ total, instructors }, null, 2),
        );

        const paginationResponse: PaginationResponse = {
          totalItems: total,
        };
        this._logger.debug(
          "ListInstructorsOfStudent request has been successfully completed",
        );

        return {
          instructors: {
            instructors: instructors.map((instructor) =>
              UserResponseMapper.toGrpcInstructorMetaResponse(instructor),
            ),
            pagination: paginationResponse,
          },
        };
      },
    );
  }

  @GrpcMethod("UserService", "ListStudentsOfInstructor")
  async listStudentsOfInstructor(
    data: ListStudentsOfInstructorRequest,
  ): Promise<ListUsersResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.listStudentsOfInstructor",
      async (span) => {
        const { page, pageSize } = data.pagination!;

        span.setAttributes({ page, pageSize });
        this._logger.debug("Handling `ListStudentsOfInstructor` request ", {
          ctx: UserGrpcController.name,
        });

        const { total, students } =
          await this._listStudentsOfInstructorUseCase.execute(data);

        console.log(
          "Students of instructor: " +
            JSON.stringify({ total, students }, null, 2),
        );

        const paginationResponse: PaginationResponse = {
          totalItems: total,
        };
        this._logger.debug(
          "ListStudentsOfInstructor request has been successfully completed",
        );

        return {
          users: {
            users: students.map((student) =>
              UserResponseMapper.toGrpcMetaResponse(student),
            ),
            pagination: paginationResponse,
          },
        };
      },
    );
  }

  @GrpcMethod("UserService", "IsStudentOfInstructor")
  async isStudentOfInstructor(
    data: IsStudentOfInstructorRequest,
  ): Promise<IsStudentOfInstructorResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.isStudentOfInstructor",
      async (span) => {
        this._logger.debug("Handling `IsStudentOfInstructor` request ", {
          ctx: UserGrpcController.name,
        });

        const { isStudent } =
          await this._isStudentOfInstructorUseCase.execute(data);

        this._logger.debug(
          "IsStudentOfInstructor request has been successfully completed",
        );

        return {
          success: {
            isStudent,
          },
        };
      },
    );
  }
  @GrpcMethod("UserService", "GetUsersStats")
  async getUsersStats(data: Empty): Promise<GetUsersStatsResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.getUsersStats",
      async (span) => {
        this._logger.debug("Handling `GetUsersStats` request ", {
          ctx: UserGrpcController.name,
        });

        const stats = await this._getUsersStatsUseCase.execute();

        this._logger.debug(
          "GetUsersStats request has been successfully completed",
        );

        return {
          success: stats,
        };
      },
    );
  }
  @GrpcMethod("UserService", "GetUsersGrowthTrend")
  async getUsersGrowthTrend(
    data: GetUsersGrowthTrendRequest,
  ): Promise<GetUsersGrowthTrendResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.getUsersGrowthTrend",
      async (span) => {
        this._logger.debug("Handling `GetUsersGrowthTrend` request ", {
          ctx: UserGrpcController.name,
        });

        const stats = await this._getUsersGrowthTrendUseCase.execute(data.year);

        this._logger.debug(
          "GetUsersGrowthTrend request has been successfully completed",
        );

        return {
          success: stats,
        };
      },
    );
  }
  @GrpcMethod("UserService", "GetInstructorsGrowthTrend")
  async getInstructorsGrowthTrend(
    data: GetInstructorsGrowthTrendRequest,
  ): Promise<GetInstructorsGrowthTrendResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.getInstructorsGrowthTrend",
      async (span) => {
        this._logger.debug("Handling `GetInstructorsGrowthTrend` request ", {
          ctx: UserGrpcController.name,
        });

        const stats = await this._getInstructorsGrowthTrendUseCase.execute(
          data.year,
        );

        this._logger.debug(
          "GetInstructorsGrowthTrend request has been successfully completed",
        );

        return {
          success: stats,
        };
      },
    );
  }
  @GrpcMethod("UserService", "GetInstructorsStats")
  async getInstructorsStats(data: Empty): Promise<GetInstructorsStatsResponse> {
    return await this._tracer.startActiveSpan(
      "UserGrpcController.getInstructorsStats",
      async (span) => {
        this._logger.debug("Handling `GetInstructorsStats` request ", {
          ctx: UserGrpcController.name,
        });

        const stats = await this._getInstructorsStatsUseCase.execute();

        this._logger.debug(
          "GetInstructorsStats request has been successfully completed",
        );

        return {
          success: stats,
        };
      },
    );
  }
}
