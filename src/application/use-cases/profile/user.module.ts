import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
// import BlockUserUserCaseImpl from "./_block-user.use-case";
import CurrentUserUseCaseImpl from "./impls/current-user.usecase";
import CheckEmailExistUseCaseImpl from "./impls/email-exist.use-case";
import GetAllEmailsUseCaseImpl from "./impls/get-emails.use-case";
import GetUsersUseCaseImpl from "./impls/get-users.usecase";
import GetUserUseCaseImpl from "./impls/get-user.use-case";
// import UnBlockUserUserCaseImpl from "./impls/_unblock-user.use-case";
import UpdateUserUseCaseImpl from "./impls/update-user.use-case";
import GetInstructorsUseCaseImpl from "./impls/get-instructors.use-case";
import BlockUserAccountUseCaseImpl from "./impls/block-user-account.use-case";
import UnBlockUserAccountUseCaseImpl from "./impls/unblock-user-account.use-case";
import BlockInstructorRoleUseCaseImpl from "./impls/block-instructor.use-case";
import UnBlockInstructorRoleUseCaseImpl from "./impls/unblock-instructor.use-case";
import CreateUserUseCaseImpl from "./impls/create-user.use-case";
import RegisterInstructorUseCase from "./impls/register-instructor.usecase";
import GetUsersByIdsUseCase from "./impls/get-users-by-ids.usecase";
import GetInstructorByUsernameUseCaseImpl from "./impls/get-instructor-by-username.use-case";
import ListStudentsOfInstructorUseCase from "./impls/list-students-of-instructor.use-case";
import ListInstructorsOfStudentUseCase from "./impls/list-instructors-of-student.use-case";
import IsStudentOfInstructorUseCase from "./impls/is-student-of-instructor.use-case";
import CourseCreatedUseCase from "./impls/course-created.use-case";
import CourseEnrolledUseCase from "./impls/course-enrolled.use-case";
import GetUsersStatsUseCase from "./impls/get-users-stats.use-case";
import GetInstructorsStatsUseCase from "./impls/get-instructors-stats.use-case";
import GetUsersGrowthTrendUseCase from "./impls/get-users-growth-trend.use-case";
import GetInstructorsGrowthTrendUseCase from "./impls/get-instructors-growth-trend.use-case";
import { ICurrentUserUseCase } from "./interfaces/current-user.interface";
import { IGetInstructorByUsernameUseCase } from "./interfaces/get-instructor-by-username.interface";
import { ICheckEmailExistUseCase } from "./interfaces/email-exist.interface";
import { IGetAllEmailsUseCase } from "./interfaces/get-emails.interface";
import { IGetUsersUseCase } from "./interfaces/get-users.inteface";
import { IGetInstructorsUseCase } from "./interfaces/get-instructors.interface";
import { IGetUserUseCase } from "./interfaces/get-user.interface";
import { IGetUsersByIdsUseCase } from "./interfaces/get-users-by-ids.interface";
import { IBlockUserAccountUseCase } from "./interfaces/block-user-account.interface";
import { IUnBlockUserAccountUseCase } from "./interfaces/unblock-user-account.interface";
import { IBlockInstructorRoleUseCase } from "./interfaces/block-instructor.interface";
import { IUnBlockInstructorRoleUseCase } from "./interfaces/unblock-instructor.interface";
import { IUpdateUserUseCase } from "./interfaces/update-user.interface";
import { ICreateUserUseCase } from "./interfaces/create-user.interface";
import { ICourseCreatedUseCase } from "./interfaces/course-created.interface";
import { IListStudentsOfInstructorUseCase } from "./interfaces/list-students-of-instructor.inteface";
import { IListInstructorsOfStudentUseCase } from "./interfaces/list-instructors-of-student.inteface";
import { IIsStudentOfInstructorUseCase } from "./interfaces/is-student-of-instructor.interface";
import { IRegisterInstructorUseCase } from "./interfaces/register-instructor.interface";
import { ICourseEnrolledUseCase } from "./interfaces/course-enrolled.interface";
import { IGetUsersStatsUseCase } from "./interfaces/get-users-stats.interface";
import { IGetUsersGrowthTrendUseCase } from "./interfaces/get-users-growth-trend.inteface";
import { IGetInstructorsGrowthTrendUseCase } from "./interfaces/get-instructors-growth-trend.interface";
import { IGetInstructorsStatsUseCase } from "./interfaces/get-instructors-stats.interface";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    // BlockUserUserCaseImpl,
    { provide: ICurrentUserUseCase, useClass: CurrentUserUseCaseImpl },
    {
      provide: IGetInstructorByUsernameUseCase,
      useClass: GetInstructorByUsernameUseCaseImpl,
    },
    { provide: ICheckEmailExistUseCase, useClass: CheckEmailExistUseCaseImpl },
    { provide: IGetAllEmailsUseCase, useClass: GetAllEmailsUseCaseImpl },
    { provide: IGetUsersUseCase, useClass: GetUsersUseCaseImpl },
    { provide: IGetInstructorsUseCase, useClass: GetInstructorsUseCaseImpl },
    { provide: IGetUserUseCase, useClass: GetUserUseCaseImpl },
    { provide: IGetUsersByIdsUseCase, useClass: GetUsersByIdsUseCase },
    {
      provide: IBlockUserAccountUseCase,
      useClass: BlockUserAccountUseCaseImpl,
    },
    {
      provide: IUnBlockUserAccountUseCase,
      useClass: UnBlockUserAccountUseCaseImpl,
    },
    {
      provide: IBlockInstructorRoleUseCase,
      useClass: BlockInstructorRoleUseCaseImpl,
    },
    {
      provide: IUnBlockInstructorRoleUseCase,
      useClass: UnBlockInstructorRoleUseCaseImpl,
    },
    { provide: IUpdateUserUseCase, useClass: UpdateUserUseCaseImpl },
    { provide: ICreateUserUseCase, useClass: CreateUserUseCaseImpl },
    { provide: ICourseCreatedUseCase, useClass: CourseCreatedUseCase },
    {
      provide: IListStudentsOfInstructorUseCase,
      useClass: ListStudentsOfInstructorUseCase,
    },
    {
      provide: IListInstructorsOfStudentUseCase,
      useClass: ListInstructorsOfStudentUseCase,
    },
    {
      provide: IIsStudentOfInstructorUseCase,
      useClass: IsStudentOfInstructorUseCase,
    },
    {
      provide: IRegisterInstructorUseCase,
      useClass: RegisterInstructorUseCase,
    },
    { provide: ICourseEnrolledUseCase, useClass: CourseEnrolledUseCase },
    { provide: IGetUsersStatsUseCase, useClass: GetUsersStatsUseCase },
    {
      provide: IGetUsersGrowthTrendUseCase,
      useClass: GetUsersGrowthTrendUseCase,
    },
    {
      provide: IGetInstructorsGrowthTrendUseCase,
      useClass: GetInstructorsGrowthTrendUseCase,
    },
    {
      provide: IGetInstructorsStatsUseCase,
      useClass: GetInstructorsStatsUseCase,
    },
  ],
  exports: [
    ICurrentUserUseCase,
    IGetInstructorByUsernameUseCase,
    ICheckEmailExistUseCase,
    IGetAllEmailsUseCase,
    IGetUsersUseCase,
    IGetInstructorsUseCase,
    IGetUserUseCase,
    IGetUsersByIdsUseCase,
    IBlockUserAccountUseCase,
    IUnBlockUserAccountUseCase,
    IBlockInstructorRoleUseCase,
    IUnBlockInstructorRoleUseCase,
    IUpdateUserUseCase,
    ICreateUserUseCase,
    ICourseCreatedUseCase,
    IListStudentsOfInstructorUseCase,
    IListInstructorsOfStudentUseCase,
    IIsStudentOfInstructorUseCase,
    IRegisterInstructorUseCase,
    ICourseEnrolledUseCase,
    IGetUsersStatsUseCase,
    IGetUsersGrowthTrendUseCase,
    IGetInstructorsGrowthTrendUseCase,
    IGetInstructorsStatsUseCase,
  ],
})
export class UserModule {}
