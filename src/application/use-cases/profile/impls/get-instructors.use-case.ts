import { Injectable } from "@nestjs/common";
import { UserDto } from "@/application/dtos/user.dto";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import {
  FindFilters,
  UserSortField,
} from "src/domain/repositories/user.repository";
import { UserStatus as ProtoUserStatus } from "src/infrastructure/grpc/generated/user/types/user_types";
import { SortOrder } from "src/infrastructure/grpc/generated/user/common";
import { ListInstructorsRequest } from "src/infrastructure/grpc/generated/user/types/instructor_types";
import { IGetInstructorsUseCase } from "../interfaces/get-instructors.interface";

@Injectable()
export default class GetInstructorsUseCaseImpl
  implements IGetInstructorsUseCase
{
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(
    dto: ListInstructorsRequest,
  ): Promise<{ instructors: UserDto[]; total: number }> {
    return await this._tracer.startActiveSpan(
      "GetInstructorsUseCaseImpl.execute",
      async (span) => {
        this._logger.debug(`Executing GetInstructorsUseCaseImpl `);

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
          await this._userRepository.findInstructors(filters);

        return {
          instructors: instructors.map(UserDto.fromDomain),
          total: totalInstructors,
        };
      },
    );
  }
}
