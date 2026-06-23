import { UserDto } from "src/application/dtos/user.dto";
import UpdateUserDto from "src/presentation/grpc/dtos/update-user.dto";

export abstract class IUpdateUserUseCase {
  abstract execute(dto: UpdateUserDto): Promise<UserDto | null>;
}
