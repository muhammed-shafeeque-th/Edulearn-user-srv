import RegisterInstructorDto from "@/presentation/grpc/input-dtos/register-instructor.dto";
import { UserDto } from "@/application/dtos/user.dto";

export abstract class IRegisterInstructorUseCase {
  abstract execute(dto: RegisterInstructorDto): Promise<UserDto | null>;
}
