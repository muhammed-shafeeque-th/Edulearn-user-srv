import User from "@/domain/entities/user-entity";
import DetailedUserDto from "@/presentation/grpc/input-dtos/detailed-user.dto";

export abstract class IGetUserUseCase {
  abstract execute(dto: DetailedUserDto): Promise<User>;
}
