import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import path, { join } from "path";
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
              protoPath: join(process.cwd(), "proto", "course_service.proto"),
              url: `${config.courseGrpcUrl}`,
              loader: {
                includeDirs: [path.join(process.cwd(), "proto")],
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
