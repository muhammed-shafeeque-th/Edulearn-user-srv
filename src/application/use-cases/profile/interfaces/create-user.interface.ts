import User from "src/domain/entities/user-entity";
import { UserAccountCreatedEvent } from "src/domain/events/user-created.event";

export abstract class ICreateUserUseCase {
  abstract execute(dto: UserAccountCreatedEvent): Promise<User>;
}
