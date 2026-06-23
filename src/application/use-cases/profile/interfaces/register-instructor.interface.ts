import RegisterInstructorDto from "src/presentation/grpc/dtos/register-instructor.dto";
import { UserDto } from "src/application/dtos/user.dto";

export abstract class IRegisterInstructorUseCase {
  abstract execute(dto: RegisterInstructorDto): Promise<UserDto | null>;
}
