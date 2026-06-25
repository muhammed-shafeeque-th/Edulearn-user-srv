import { UserDto } from "@/application/dtos/user.dto";
import UpdateUserDto from "@/presentation/grpc/input-dtos/update-user.dto";

export abstract class IUpdateUserUseCase {
  abstract execute(dto: UpdateUserDto): Promise<UserDto | null>;
}
