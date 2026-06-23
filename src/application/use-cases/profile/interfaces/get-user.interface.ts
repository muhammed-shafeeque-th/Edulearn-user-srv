import { UserDto } from "src/application/dtos/user.dto";
import DetailedUserDto from "src/presentation/grpc/dtos/detailed-user.dto";

export abstract class IGetUserUseCase {
  abstract execute(dto: DetailedUserDto): Promise<UserDto>;
}
