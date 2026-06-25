import User from "src/domain/entities/user-entity";

export abstract class IUnBlockInstructorRoleUseCase {
  abstract execute(dto: { instructorId: string }): Promise<User>;
}
