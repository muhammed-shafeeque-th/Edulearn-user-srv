import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import {
  FindFilters,
  UserSortField,
} from "src/domain/repositories/user.repository";
import { UserStatus as ProtoUserStatus } from "src/infrastructure/grpc/generated/user/types/user_types";
import { SortOrder } from "src/infrastructure/grpc/generated/user/common";
import { ListInstructorsRequest } from "src/infrastructure/grpc/generated/user/types/instructor_types";

@Injectable()
export default class GetInstructorsUseCaseImpl {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}
  public async execute(
    dto: ListInstructorsRequest,
  ): Promise<{ instructors: UserDto[]; total: number }> {
    return await this.tracer.startActiveSpan(
      "GetInstructorsUseCaseImpl.execute",
      async (span) => {
        this.logger.info(`Executing GetInstructorsUseCaseImpl `);

        console.log("Instructors request :" + JSON.stringify(dto, null, 2));

        const page = dto.pagination?.page ?? 1;
        let pageSize = dto.pagination?.pageSize ?? 20;
        // Allow fetching up to 1000 records for client-side pagination scenarios
        pageSize = Math.min(Math.max(pageSize, 1), 1000);

        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        const sortOrder = dto.sort?.order === SortOrder.ASC ? "ASC" : "DESC";
        const sortField = (dto.sort?.field as UserSortField) || "createdAt";

        let status: string | undefined;
        if (dto.filter?.status === ProtoUserStatus.ACTIVE) status = "active";
        else if (dto.filter?.status === ProtoUserStatus.BLOCKED)
          status = "blocked";
        else if (dto.filter?.status === ProtoUserStatus.DELETED)
          status = "deleted";

        const filters: FindFilters = {
          offset,
          limit,
          sortOrder,
          sortField,
          status,
          email: dto.filter?.email,
          search: dto.filter?.search,
        };

        const { instructors, totalInstructors } =
          await this.userRepository.findInstructors(filters);

        return {
          instructors: instructors.map(UserDto.fromDomain),
          total: totalInstructors,
        };
      },
    );
  }
}
