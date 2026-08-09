import User from "@/domain/entities/user-entity";
import GetUsersByIdsDto from "@/presentation/grpc/input-dtos/get-users-by-ids.dto";

export abstract class IGetUsersByIdsUseCase {
  abstract execute(dto: GetUsersByIdsDto): Promise<{ users: User[] }>;
}
