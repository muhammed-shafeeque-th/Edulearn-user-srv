import { Module } from "@nestjs/common";
import { UserModule } from "src/application/use-cases/user/user.module";
import { UserConsumer } from "./consumers/user.consumer";
import { UserHandler } from "./handlers/user.handler";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { CourseCreatedHandler } from "./handlers/course-created.handler";
import { CourseEnrolledHandler } from "./handlers/course-enrolled.handler";
import { CourseConsumer } from "./consumers/course.consumer";

@Module({
  imports: [
    RedisModule,
    UserModule,
  ],
  providers: [ CourseCreatedHandler, CourseEnrolledHandler, UserHandler],

  controllers: [CourseConsumer, UserConsumer],
})
export class KafkaPresentationModule { }
