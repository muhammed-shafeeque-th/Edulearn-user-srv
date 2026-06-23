import { UserDto } from "@/application/dtos/user.dto";
import CurrentUserDto from "@/presentation/grpc/input-dtos/current-user.dto";

export abstract class ICurrentUserUseCase {
  abstract execute(dto: CurrentUserDto): Promise<UserDto>;
}
