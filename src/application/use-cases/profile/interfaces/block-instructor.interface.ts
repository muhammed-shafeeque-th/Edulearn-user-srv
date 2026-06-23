import User from "src/domain/entities/user-entity";

export abstract class IBlockInstructorRoleUseCase {
  abstract execute(dto: { instructorId: string }): Promise<User>;
}
