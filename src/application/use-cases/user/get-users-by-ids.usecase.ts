import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import GetUsersByIdsDto from "src/presentation/grpc/dtos/get-users-by-ids.dto";

@Injectable()
export default class GetUsersByIdsUseCase {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}
  public async execute(dto: GetUsersByIdsDto): Promise<{ users: UserDto[] }> {
    return await this.tracer.startActiveSpan(
      "GetUsersByIdsUseCase.execute",
      async (span) => {
        this.logger.info(`Executing GetUsersByIdsUseCase `);
        // Checks users with limit and offset
        const users = await this.userRepository.findUsersByIds(dto.userIds);

        return { users: users.map(UserDto.fromDomain) };
      }
    );
  }
}
