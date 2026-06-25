import { IsInt, IsOptional, Max, Min } from "class-validator";
import { PaginationRequest } from "src/infrastructure/grpc/generated/user/common";

export class PaginationRequestDto implements PaginationRequest {
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
