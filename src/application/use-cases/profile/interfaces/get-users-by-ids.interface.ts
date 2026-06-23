import { UserDto } from "src/application/dtos/user.dto";
import GetUsersByIdsDto from "src/presentation/grpc/dtos/get-users-by-ids.dto";

export abstract class IGetUsersByIdsUseCase {
  abstract execute(dto: GetUsersByIdsDto): Promise<{ users: UserDto[] }>;
}
