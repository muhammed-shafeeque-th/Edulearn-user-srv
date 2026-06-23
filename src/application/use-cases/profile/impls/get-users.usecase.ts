import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";
import {
  IUserRepository,
  FindFilters,
  DOMAIN_USER_FIELDS,
  UserSortField,
} from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import GetUsersDto, {
  SortOptionDto,
  UserFilterDto,
} from "src/presentation/grpc/dtos/get-users.dto";
import { IGetUsersUseCase } from "../interfaces/get-users.inteface";

@Injectable()
export default class GetUsersUseCaseImpl implements IGetUsersUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  public async execute(
    dto: GetUsersDto,
  ): Promise<{ users: UserDto[]; total: number }> {
    return await this._tracer.startActiveSpan(
      "GetUsersUseCaseImpl.execute",
      async (span) => {
        this._logger.debug(`Executing GetUsersUseCaseImpl`, { dto });

        const filterObj = this.domainValidateAndMapFilters(dto);

        span.setAttributes({
          offset: filterObj.offset,
          limit: filterObj.limit,
          ...filterObj,
        });

        this._logger.debug("Calling repository.findUsers with filters", {
          filterObj,
        });

        const { users, totalUsers } =
          await this._userRepository.findUsers(filterObj);

        this._logger.debug(
          `Successfully fetched ${users.length} users (total: ${totalUsers})`,
        );

        return { users: users.map(UserDto.fromDomain), total: totalUsers };
      },
    );
  }

  private domainValidateAndMapFilters(dto: GetUsersDto): FindFilters {
    const filters: FindFilters = {};

    const page = dto.pagination?.page ?? 1;
    let pageSize = dto.pagination?.pageSize ?? 20;
    // Allow fetching up to 1000 records for client-side pagination scenarios
    pageSize = Math.min(Math.max(pageSize, 1), 1000);

    filters.offset = (page - 1) * pageSize;
    filters.limit = pageSize;

    if (dto.filter) {
      const filter = dto.filter;
      filters.status = UserFilterDto.getDomainStatus(filter.status);

      if (typeof filter.email === "string" && filter.email.trim().length > 0) {
        filters.email = filter.email.trim();
      }

      if (typeof filter.role === "string" && filter.role.trim().length > 0) {
        filters.role = filter.role.trim();
      }

      if (
        typeof filter.search === "string" &&
        filter.search.trim().length > 0
      ) {
        filters.search = filter.search.trim();
      }
    } else {
    }

    if (dto.sort) {
      const sort = dto.sort;
      if (typeof sort.field === "string" && sort.field.trim()) {
        const field = sort.field.trim();
        console.log("sort.field", field);
        if (!this.isDomainSortField(field)) {
          this._logger.error("Sort field not allowed by domain", {
            field,
            allowed: DOMAIN_USER_FIELDS,
          });
          throw new BadRequestException(
            `Sort field must be one of: ${DOMAIN_USER_FIELDS.join(", ")}`,
          );
        }
        filters.sortField = field;
      }
      if (typeof sort.order === "string") {
        filters.sortOrder = SortOptionDto.getGrpcOrderString(sort.order);
      }
    }

    return filters;
  }

  private isDomainSortField(field: string): field is UserSortField {
    if (DOMAIN_USER_FIELDS.includes(field as UserSortField)) {
      return true;
    }
    return false;
  }
}
