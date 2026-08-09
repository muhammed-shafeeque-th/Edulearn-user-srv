import User from "@/domain/entities/user-entity";
import UpdateUserDto from "@/presentation/grpc/input-dtos/update-user.dto";

export abstract class IUpdateUserUseCase {
  abstract execute(dto: UpdateUserDto): Promise<User| null>;
}
