import RegisterInstructorDto from "@/presentation/grpc/input-dtos/register-instructor.dto";
import User from "@/domain/entities/user-entity";

export abstract class IRegisterInstructorUseCase {
  abstract execute(dto: RegisterInstructorDto): Promise<User| null>;
}
