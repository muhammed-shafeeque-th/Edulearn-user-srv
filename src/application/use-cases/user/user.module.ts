import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import BlockUserUserCaseImpl from "./block-user.use-case";
import CurrentUserUseCaseImpl from "./current-user.usecase";
import CheckEmailExistUseCaseImpl from "./email-exist.use-case";
import GetAllEmailsUseCaseImpl from "./get-emails.use-case";
import GetAllUsersUseCaseImpl from "./get-users.usecase";
import GetUserUseCaseImpl from "./get-user.use-case";
import UnBlockUserUserCaseImpl from "./unblock-user.use-case";
import UpdateUserUseCaseImpl from "./update-user.use-case";
import GetAllInstructorsUseCaseImpl from "./get-instructors.use-case";
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

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    BlockUserUserCaseImpl,
    CurrentUserUseCaseImpl,
    GetInstructorByUsernameUseCaseImpl,
    CheckEmailExistUseCaseImpl,
    GetAllEmailsUseCaseImpl,
    GetAllUsersUseCaseImpl,
    GetAllInstructorsUseCaseImpl,
    GetUserUseCaseImpl,
    GetUsersByIdsUseCase,
    UnBlockUserUserCaseImpl,
    UpdateUserUseCaseImpl,
    CreateUserUseCaseImpl,
    CourseCreatedUseCase,
    ListStudentsOfInstructorUseCase,
    ListInstructorsOfStudentUseCase,
    IsStudentOfInstructorUseCase,
    RegisterInstructorUseCase,
    CourseEnrolledUseCase,
    GetUsersStatsUseCase,
    GetInstructorsStatsUseCase
  ],
  exports: [
    BlockUserUserCaseImpl,
    GetUsersByIdsUseCase,
    CurrentUserUseCaseImpl,
    GetInstructorByUsernameUseCaseImpl,
    CheckEmailExistUseCaseImpl,
    GetAllEmailsUseCaseImpl,
    GetAllUsersUseCaseImpl,
    GetAllInstructorsUseCaseImpl,
    RegisterInstructorUseCase,
    GetUserUseCaseImpl,
    UnBlockUserUserCaseImpl,
    CreateUserUseCaseImpl,
    CourseCreatedUseCase,
    ListStudentsOfInstructorUseCase,
    ListInstructorsOfStudentUseCase,
    IsStudentOfInstructorUseCase,
    UpdateUserUseCaseImpl,
    CourseEnrolledUseCase,
    GetUsersStatsUseCase,
    GetInstructorsStatsUseCase,
  ],
})
export class UserModule {}
