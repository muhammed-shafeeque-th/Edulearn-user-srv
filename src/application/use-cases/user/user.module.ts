import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
// import BlockUserUserCaseImpl from "./_block-user.use-case";
import CurrentUserUseCaseImpl from "./current-user.usecase";
import CheckEmailExistUseCaseImpl from "./email-exist.use-case";
import GetAllEmailsUseCaseImpl from "./get-emails.use-case";
import GetAllUsersUseCaseImpl from "./get-users.usecase";
import GetUserUseCaseImpl from "./get-user.use-case";
// import UnBlockUserUserCaseImpl from "./_unblock-user.use-case";
import UpdateUserUseCaseImpl from "./update-user.use-case";
import GetAllInstructorsUseCaseImpl from "./get-instructors.use-case";
import BlockUserAccountUseCaseImpl from "./block-user-account.use-case";
import UnBlockUserAccountUseCaseImpl from "./unblock-user-account.use-case";
import BlockInstructorRoleUseCaseImpl from "./block-instructor.use-case";
import UnBlockInstructorRoleUseCaseImpl from "./unblock-instructor.use-case";
import CreateUserUseCaseImpl from "./create-user.use-case";
import RegisterInstructorUseCase from "./register-instructor.usecase";
import GetUsersByIdsUseCase from "./get-users-by-ids.usecase";
import GetInstructorByUsernameUseCaseImpl from "./get-instructor-by-username.use-case";
import ListStudentsOfInstructorUseCase from "./list-students-of-instructor.use-case";
import ListInstructorsOfStudentUseCase from "./list-instructors-of-student.use-case";
import IsStudentOfInstructorUseCase from "./is-student-of-instructor.use-case";
import CourseCreatedUseCase from "./course-created.use-case";
import CourseEnrolledUseCase from "./course-enrolled.use-case";
import GetUsersStatsUseCase from "./get-users-stats.use-case";
import GetInstructorsStatsUseCase from "./get-instructors-stats.use-case";
import GetUsersGrowthTrendUseCase from "./get-users-growth-trend.use-case";
import GetInstructorsGrowthTrendUseCase from "./get-instructors-growth-trend.use-case";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    // BlockUserUserCaseImpl,
    CurrentUserUseCaseImpl,
    GetInstructorByUsernameUseCaseImpl,
    CheckEmailExistUseCaseImpl,
    GetAllEmailsUseCaseImpl,
    GetAllUsersUseCaseImpl,
    GetAllInstructorsUseCaseImpl,
    GetUserUseCaseImpl,
    GetUsersByIdsUseCase,
    // UnBlockUserUserCaseImpl,
    BlockUserAccountUseCaseImpl,
    UnBlockUserAccountUseCaseImpl,
    BlockInstructorRoleUseCaseImpl,
    UnBlockInstructorRoleUseCaseImpl,
    UpdateUserUseCaseImpl,
    CreateUserUseCaseImpl,
    CourseCreatedUseCase,
    ListStudentsOfInstructorUseCase,
    ListInstructorsOfStudentUseCase,
    IsStudentOfInstructorUseCase,
    RegisterInstructorUseCase,
    CourseEnrolledUseCase,
    GetUsersStatsUseCase,
    GetUsersGrowthTrendUseCase,
    GetInstructorsGrowthTrendUseCase,
    GetInstructorsStatsUseCase
  ],
  exports: [
    // BlockUserUserCaseImpl,
    GetUsersByIdsUseCase,
    CurrentUserUseCaseImpl,
    GetInstructorByUsernameUseCaseImpl,
    CheckEmailExistUseCaseImpl,
    GetAllEmailsUseCaseImpl,
    GetAllUsersUseCaseImpl,
    GetAllInstructorsUseCaseImpl,
    RegisterInstructorUseCase,
    GetUserUseCaseImpl,
    // UnBlockUserUserCaseImpl,
    BlockUserAccountUseCaseImpl,
    UnBlockUserAccountUseCaseImpl,
    BlockInstructorRoleUseCaseImpl,
    UnBlockInstructorRoleUseCaseImpl,
    CreateUserUseCaseImpl,
    CourseCreatedUseCase,
    ListStudentsOfInstructorUseCase,
    ListInstructorsOfStudentUseCase,
    IsStudentOfInstructorUseCase,
    UpdateUserUseCaseImpl,
    CourseEnrolledUseCase,
    GetUsersGrowthTrendUseCase,
    GetInstructorsGrowthTrendUseCase,
    GetUsersStatsUseCase,
    GetInstructorsStatsUseCase,
  ],
})
export class UserModule {}
