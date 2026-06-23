import { UserDto } from "src/application/dtos/user.dto";
import GetUsersDto from "src/presentation/grpc/dtos/get-users.dto";

export abstract class IGetUsersUseCase {
  abstract execute(
    dto: GetUsersDto,
  ): Promise<{ users: UserDto[]; total: number }>;
}
