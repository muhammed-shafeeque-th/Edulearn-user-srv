import User from "src/domain/entities/user-entity";

export abstract class IBlockUserAccountUseCase {
  abstract execute(dto: { userId: string }): Promise<User>;
}
