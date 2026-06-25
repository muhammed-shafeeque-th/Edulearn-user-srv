import { UserDto } from "@/application/dtos/user.dto";
import DetailedUserDto from "@/presentation/grpc/input-dtos/detailed-user.dto";

export abstract class IGetUserUseCase {
  abstract execute(dto: DetailedUserDto): Promise<UserDto>;
}
