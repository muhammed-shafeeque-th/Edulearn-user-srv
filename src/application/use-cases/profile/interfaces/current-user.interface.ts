import User from "@/domain/entities/user-entity";
import CurrentUserDto from "@/presentation/grpc/input-dtos/current-user.dto";

export abstract class ICurrentUserUseCase {
  abstract execute(dto: CurrentUserDto): Promise<User>;
}
