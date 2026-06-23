import { UserDto } from "@/application/dtos/user.dto";
import GetUsersByIdsDto from "@/presentation/grpc/input-dtos/get-users-by-ids.dto";

export abstract class IGetUsersByIdsUseCase {
  abstract execute(dto: GetUsersByIdsDto): Promise<{ users: UserDto[] }>;
}
