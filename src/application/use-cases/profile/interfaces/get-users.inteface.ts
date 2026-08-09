import User from "@/domain/entities/user-entity";
import GetUsersDto from "@/presentation/grpc/input-dtos/get-users.dto";

export abstract class IGetUsersUseCase {
  abstract execute(
    dto: GetUsersDto,
  ): Promise<{ users: User[]; total: number }>;
}
