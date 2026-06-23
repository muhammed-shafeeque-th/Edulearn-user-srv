import { UserDto } from "@/application/dtos/user.dto";
import GetUsersDto from "@/presentation/grpc/input-dtos/get-users.dto";

export abstract class IGetUsersUseCase {
  abstract execute(
    dto: GetUsersDto,
  ): Promise<{ users: UserDto[]; total: number }>;
}
