import { IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PaginationRequestDto } from "./pagination.dto";
import { ListInstructorsRequest } from "src/infrastructure/grpc/generated/user/types/instructor_types";

export default class GetInstructorsDto implements ListInstructorsRequest {
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationRequestDto)
  pagination: PaginationRequestDto;

  @IsOptional()
  filter: any; // Using any for now as I need to check if UserFilterDto exists or strict typing is needed here. Ideally should be UserFilterDto.

  @IsOptional()
  sort: any; // Same for sort.
}
