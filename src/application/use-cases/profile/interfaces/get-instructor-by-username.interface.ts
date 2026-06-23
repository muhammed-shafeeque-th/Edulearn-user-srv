import { UserDto } from "@/application/dtos/user.dto";
import GetUserByUsernameDto from "@/presentation/grpc/input-dtos/get-user-by-username.dto";

export abstract class IGetInstructorByUsernameUseCase {
  abstract execute(dto: GetUserByUsernameDto): Promise<UserDto>;
}
