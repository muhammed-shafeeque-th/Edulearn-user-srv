import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsString,
  IsEmail,
  ValidateNested,
} from "class-validator";
import { Type, plainToInstance } from "class-transformer";
import { UserStatus as UserDomainStatus } from "src/domain/entities/user-entity";
import {
  PaginationRequest,
  SortOrder as GrpcSortOrder,
} from "src/infrastructure/grpc/generated/user/common";
import {
  ListUsersRequest,
  UserStatus as GrpcUserStatus,
  UserFilter as GrpcUserFilter,
} from "src/infrastructure/grpc/generated/user/types/user_types";
import { PaginationRequestDto } from "./pagination.dto";

export enum SortOrder {
  SORT_ORDER_UNSPECIFIED = 0,
  ASC = 1,
  DESC = 2,
  UNRECOGNIZED = -1,
}

export enum UserStatus {
  USER_STATUS_UNSPECIFIED = 0,
  ACTIVE = 1,
  BLOCKED = 2,
  DELETED = 3,
  UNRECOGNIZED = -1,
}

export class SortOptionDto {
  @IsString()
  field: string;

  @IsEnum(SortOrder)
  order: SortOrder;

  /** Map to gRPC sort order string ("ASC" | "DESC") */
  static getGrpcOrderString(order: SortOrder ): "ASC" | "DESC" {
    if (order === SortOrder.DESC) return "DESC";
    return "ASC";
  }

  /** Map to proto enum value */
  getGrpcOrder(): GrpcSortOrder {
    if (this.order === SortOrder.DESC) return GrpcSortOrder.DESC;
    if (this.order === SortOrder.ASC) return GrpcSortOrder.ASC;
    return GrpcSortOrder.SORT_ORDER_UNSPECIFIED;
  }
}

export class UserFilterDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  search?: string;

  /** Map UserStatus (domain) to gRPC UserStatus */
  getGrpcStatus(): GrpcUserStatus {
    if (typeof this.status === "number") {
      return this.status as GrpcUserStatus;
    }
    return GrpcUserStatus.USER_STATUS_UNSPECIFIED;
  }
  /** Maps gRPC UserStatus to Domain UserStatus */
  static getDomainStatus(status: UserStatus): UserDomainStatus | null {
    switch (status) {
      case UserStatus.ACTIVE:
        return UserDomainStatus.ACTIVE;
      case UserStatus.BLOCKED:
        return UserDomainStatus.BLOCKED;
      case UserStatus.DELETED:
        return UserDomainStatus.DELETED;
      case UserStatus.USER_STATUS_UNSPECIFIED:
      default:
        return null;
    }
  }

  toGrpc(): GrpcUserFilter {
    return {
      status: this.getGrpcStatus(),
      email: this.email ?? "",
      role: this.role ?? "",
      search: this.search ?? "",
    };
  }
}


export default class GetUsersDto implements ListUsersRequest {
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationRequestDto)
  pagination: PaginationRequestDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserFilterDto)
  filter: UserFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SortOptionDto)
  sort: SortOptionDto;

  toGrpcRequest(): ListUsersRequest {
    return {
      pagination: this.pagination
        ? {
            page: this.pagination.page ?? 1,
            pageSize: this.pagination.pageSize ?? 20,
          }
        : undefined,
      filter: this.filter ? this.filter.toGrpc() : undefined,
      sort: this.sort
        ? {
            field: this.sort.field,
            order: this.sort.getGrpcOrder(),
          }
        : undefined,
    };
  }
}
