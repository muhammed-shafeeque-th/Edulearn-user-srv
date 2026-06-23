import { UserDto } from "src/application/dtos/user.dto";
import DetailedUserDto from "src/presentation/grpc/dtos/get-user-by-username.dto";

export abstract class IGetInstructorByUsernameUseCase {
  abstract execute(dto: DetailedUserDto): Promise<UserDto>;
}
