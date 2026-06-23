import { IsArray, IsString } from "class-validator";
import { ListUsersByIdsRequest } from "src/infrastructure/grpc/generated/user/types/user_types";

export default class GetUsersByIdsDto implements ListUsersByIdsRequest {
  @IsArray({ each: true })
  userIds: string[];
}
