import User from "src/domain/entities/user-entity";

export abstract class IUnBlockUserAccountUseCase {
  abstract execute(dto: { userId: string }): Promise<User>;
}
