import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import path from "path";
import { getProtoPath, PROTO_ROOT_DIR } from "@edulearn/core";
import { GRPC_COURSE_CLIENT_TOKEN } from "./course/constants";
import { CourseClient } from "./course/course.client";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { AppConfigService } from "src/infrastructure/config/config.service";

@Module({
  imports: [
    RedisModule,
    ClientsModule.registerAsync({
      clients: [
        {
          name: GRPC_COURSE_CLIENT_TOKEN,
          useFactory: (config: AppConfigService) => ({
            transport: Transport.GRPC,
            options: {
              package: "course_service",
              url: `${config.courseGrpcUrl}`,
              protoPath: [path.join(getProtoPath("course"))],
              loader: {
                includeDirs: [path.join(PROTO_ROOT_DIR, "course")],
              },
            },
          }),
          inject: [AppConfigService],
        },
      ],
    }),
  ],
  providers: [CourseClient],
  exports: [CourseClient],
})
export class GrpcClientsModule {}
