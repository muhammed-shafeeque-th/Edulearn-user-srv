import { IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PaginationRequestDto } from "./pagination.dto";
import { GetInstructorsRequest } from "src/infrastructure/grpc/generated/user/types/instructor_types";

export default class GetInstructorsDto implements GetInstructorsRequest {
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationRequestDto)
  pagination: PaginationRequestDto;
}
