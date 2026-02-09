import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import GetInstructorsDto from "src/presentation/grpc/dtos/get-instructors.dto";

@Injectable()
export default class GetInstructorsUseCaseImpl {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}
  public async execute(
    dto: GetInstructorsDto
  ): Promise<{ instructors: UserDto[]; total: number }> {
    return await this.tracer.startActiveSpan(
      "GetInstructorsUseCaseImpl.execute",
      async (span) => {
        this.logger.info(`Executing GetInstructorsUseCaseImpl `);

        const page = dto.pagination?.page ?? 1;
        let pageSize = dto.pagination?.pageSize ?? 20;
        pageSize = Math.min(Math.max(pageSize, 1), 100);

        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        const { instructors, totalInstructors } =
          await this.userRepository.findInstructors(offset, limit);

        return {
          instructors: instructors.map(UserDto.fromDomain),
          total: totalInstructors,
        };
      }
    );
  }
}
