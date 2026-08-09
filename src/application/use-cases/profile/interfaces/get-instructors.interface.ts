import User from "@/domain/entities/user-entity";
import { ListInstructorsRequest } from "src/infrastructure/grpc/generated/user/types/instructor_types";

export abstract class IGetInstructorsUseCase {
  abstract execute(
    dto: ListInstructorsRequest,
  ): Promise<{ instructors: User[]; total: number }>;
}
