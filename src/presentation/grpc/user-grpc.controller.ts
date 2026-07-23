import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

import { DomainException } from "src/domain/exceptions";
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
  GetUserEmailsRequest,
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
  Error,
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

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.code,
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
          this._logger.debug(
            "ListUsers request has been successfully completed",
          );

          return {
            users: {
              users: users.map((user) => user.toGrpcMetaResponse()),
              pagination: paginationResponse,
            },
          };
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `GetUsers`", {
        error,
      });
      throw error;
    }
  }
  @GrpcMethod("UserService", "ListUsersByIds")
  async getUsersByIds(data: GetUsersByIdsDto): Promise<ListUsersResponse> {
    try {
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
              users: users.map((user) => user.toGrpcResponse()),
              pagination: paginationResponse,
            },
          };
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `getUsersByIds`", {
        error,
      });
      throw error;
    }
  }
  @GrpcMethod("UserService", "ListInstructors")
  async listInstructors(
    data: ListInstructorsRequest,
  ): Promise<ListInstructorsResponse> {
    try {
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
                instructor.toGrpcInstructorMetaResponse(),
              ),
              pagination: paginationResponse,
            },
          };
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `ListInstructors`", {
        error,
      });
      throw error;
    }
  }

  @GrpcMethod("UserService", "GetCurrentUser")
  async getCurrentUser(
    data: GetCurrentUserRequest,
  ): Promise<GetCurrentUserResponse> {
    try {
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
            user: user.toGrpcResponse(),
          } as GetCurrentUserResponse;
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `getCurrentUser`", {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("UserService", "GetUserEmails")
  async getUserEmails(): Promise<GetUserEmailsResponse> {
    try {
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
    } catch (error) {
      this._logger.error("Error processing gRPC request `GetUsersEmails`", {
        error,
      });

      // if (error instanceof DomainException) {
      //   return {
      //     error: this.createErrorResponse(error),
      //   };
      // }
      throw error;
    }
  }
  @GrpcMethod("UserService", "CheckUserEmailExist")
  async checkUserEmailExist(
    data: CheckUserByEmailRequest,
  ): Promise<CheckUserByEmailResponse> {
    try {
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
    } catch (error) {
      this._logger.error("Error processing gRPC request `CheckEmailExists`", {
        error,
      });

      if (error instanceof DomainException) {
        throw error;
      }
      throw error;
    }
  }

  // @GrpcMethod("UserService", "BlockUser")
  // async blockUser(data: BlockUserRequest): Promise<BlockUserResponse> {
  //   try {
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
    try {
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
          return { user: user.toGrpcResponse() } as GetUserResponse;
        },
      );
    } catch (error) {
      this._logger.error(
        "Error processing gRPC request `GetInstructorByName`",
        {
          error,
        },
      );

      // if (error instanceof DomainException) {
      //   return {
      //     error: this.createErrorResponse(error),
      //   };
      // }
      throw error;
    }
  }
  @GrpcMethod("UserService", "GetUser")
  async getUser(data: GetUserRequest): Promise<GetUserResponse> {
    try {
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
          return { user: user.toGrpcResponse() } as GetUserResponse;
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `getUser`", {
        error,
      });

      // if (error instanceof DomainException) {
      //   return {
      //     error: this.createErrorResponse(error),
      //   };
      // }
      throw error;
    }
  }

  // @GrpcMethod("UserService", "UnBlockUser")
  // async unBlockUser(data: UnBlockUserRequest): Promise<UnBlockUserResponse> {
  //   try {
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
    try {
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
    } catch (error) {
      this._logger.error("Error processing gRPC request `BlockAccount`", {
        error,
      });
      throw error;
    }
  }

  @GrpcMethod("UserService", "UnBlockAccount")
  async unBlockAccount(
    data: UnBlockAccountRequest,
  ): Promise<UnBlockAccountResponse> {
    try {
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
    } catch (error) {
      this._logger.error("Error processing gRPC request `UnBlockAccount`", {
        error,
      });
      throw error;
    }
  }

  @GrpcMethod("UserService", "BlockInstructor")
  async blockInstructor(
    data: BlockInstructorRequest,
  ): Promise<BlockInstructorResponse> {
    try {
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
    } catch (error) {
      this._logger.error("Error processing gRPC request `BlockInstructor`", {
        error,
      });
      throw error;
    }
  }

  @GrpcMethod("UserService", "UnBlockInstructor")
  async unBlockInstructor(
    data: UnBlockInstructorRequest,
  ): Promise<UnBlockInstructorResponse> {
    try {
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
    } catch (error) {
      this._logger.error("Error processing gRPC request `UnBlockInstructor`", {
        error,
      });
      throw error;
    }
  }

  @GrpcMethod("UserService", "UpdateUserDetails")
  async updateUserDetails(
    data: UpdateUserDetailsRequest,
  ): Promise<UpdateUserDetailsResponse> {
    try {
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
            user: updatedUser.toGrpcResponse(),
          } as UpdateUserDetailsResponse;
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `UpdateUserDetails`", {
        error,
      });

      // if (error instanceof DomainException) {
      //   return {
      //     error: this.createErrorResponse(error),
      //   };
      // }
      throw error;
    }
  }
  @GrpcMethod("UserService", "RegisterInstructor")
  async registerInstructor(
    data: RegisterInstructorRequest,
  ): Promise<RegisterInstructorResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "UserGrpcController.registerInstructor",
        async (span) => {
          const { userId } = data!;

          span.setAttributes({ userId });
          this._logger.debug("Handling `RegisterInstructor` request ", {
            ctx: UserGrpcController.name,
          });

          const updatedUser =
            await this._registerInstructorUseCase.execute(data);

          this._logger.debug(
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
      this._logger.error("Error processing gRPC request `RegisterInstructor`", {
        error,
      });

      // if (error instanceof DomainException) {
      //   return {
      //     error: this.createErrorResponse(error),
      //   };
      // }
      throw error;
    }
  }

  @GrpcMethod("UserService", "ListInstructorsOfStudent")
  async listInstructorsOfStudent(
    data: ListInstructorsOfStudentRequest,
  ): Promise<ListInstructorsResponse> {
    try {
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
                instructor.toGrpcInstructorMetaResponse(),
              ),
              pagination: paginationResponse,
            },
          };
        },
      );
    } catch (error) {
      this._logger.error(
        "Error processing gRPC request `ListInstructorsOfStudent`",
        {
          error,
        },
      );
      throw error;
    }
  }

  @GrpcMethod("UserService", "ListStudentsOfInstructor")
  async listStudentsOfInstructor(
    data: ListStudentsOfInstructorRequest,
  ): Promise<ListUsersResponse> {
    try {
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
              users: students.map((student) => student.toGrpcMetaResponse()),
              pagination: paginationResponse,
            },
          };
        },
      );
    } catch (error) {
      this._logger.error(
        "Error processing gRPC request `ListStudentsOfInstructor`",
        {
          error,
        },
      );
      throw error;
    }
  }

  @GrpcMethod("UserService", "IsStudentOfInstructor")
  async isStudentOfInstructor(
    data: IsStudentOfInstructorRequest,
  ): Promise<IsStudentOfInstructorResponse> {
    try {
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
    } catch (error) {
      this._logger.error(
        "Error processing gRPC request `IsStudentOfInstructor`",
        {
          error,
        },
      );
      throw error;
    }
  }
  @GrpcMethod("UserService", "GetUsersStats")
  async getUsersStats(data: Empty): Promise<GetUsersStatsResponse> {
    try {
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
    } catch (error) {
      this._logger.error("Error processing gRPC request `GetUsersStats`", {
        error,
      });
      throw error;
    }
  }
  @GrpcMethod("UserService", "GetUsersGrowthTrend")
  async getUsersGrowthTrend(
    data: GetUsersGrowthTrendRequest,
  ): Promise<GetUsersGrowthTrendResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "UserGrpcController.getUsersGrowthTrend",
        async (span) => {
          this._logger.debug("Handling `GetUsersGrowthTrend` request ", {
            ctx: UserGrpcController.name,
          });

          const stats = await this._getUsersGrowthTrendUseCase.execute(
            data.year,
          );

          this._logger.debug(
            "GetUsersGrowthTrend request has been successfully completed",
          );

          return {
            success: stats,
          };
        },
      );
    } catch (error) {
      this._logger.error("Error processing gRPC request `GetUsersStats`", {
        error,
      });
      throw error;
    }
  }
  @GrpcMethod("UserService", "GetInstructorsGrowthTrend")
  async getInstructorsGrowthTrend(
    data: GetInstructorsGrowthTrendRequest,
  ): Promise<GetInstructorsGrowthTrendResponse> {
    try {
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
    } catch (error) {
      this._logger.error("Error processing gRPC request `GetUsersStats`", {
        error,
      });
      throw error;
    }
  }
  @GrpcMethod("UserService", "GetInstructorsStats")
  async getInstructorsStats(data: Empty): Promise<GetInstructorsStatsResponse> {
    try {
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
    } catch (error) {
      this._logger.error("Error processing gRPC request `GetUsersStats`", {
        error,
      });
      throw error;
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
