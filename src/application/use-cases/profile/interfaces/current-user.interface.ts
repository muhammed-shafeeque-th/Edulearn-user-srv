import { UserDto } from "src/application/dtos/user.dto";
import CurrentUserDto from "src/presentation/grpc/dtos/current-user.dto";

export abstract class ICurrentUserUseCase {
  abstract execute(dto: CurrentUserDto): Promise<UserDto>;
}
