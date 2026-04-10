import { Injectable } from "@nestjs/common";
import { UserDto } from "src/application/dtos/user.dto";
import { BadRequestException } from "src/shared/exceptions/infra.exceptions";
import {
  IUserRepository,
  FindFilters,
  DOMAIN_USER_FIELDS,
  UserSortField,
} from "src/domain/repositories/user.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import GetUsersDto, {
  SortOptionDto,
  UserFilterDto,
} from "src/presentation/grpc/dtos/get-users.dto";

@Injectable()
export default class GetUsersUseCaseImpl {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  public async execute(
    dto: GetUsersDto,
  ): Promise<{ users: UserDto[]; total: number }> {
    return await this.tracer.startActiveSpan(
      "GetUsersUseCaseImpl.execute",
      async (span) => {
        this.logger.info(`Executing GetUsersUseCaseImpl`, { dto });


        const filterObj = this.domainValidateAndMapFilters(dto);

        span.setAttributes({
          offset: filterObj.offset,
          limit: filterObj.limit,
          ...filterObj,
        });

        this.logger.info("Calling repository.findUsers with filters", {
          filterObj,
        });

        const { users, totalUsers } =
          await this.userRepository.findUsers(filterObj);

        this.logger.info(
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
          this.logger.error("Sort field not allowed by domain", {
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
