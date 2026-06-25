import { UserDto } from "src/application/dtos/user.dto";
import { ListInstructorsRequest } from "src/infrastructure/grpc/generated/user/types/instructor_types";

export abstract class IGetInstructorsUseCase {
  abstract execute(
    dto: ListInstructorsRequest,
  ): Promise<{ instructors: UserDto[]; total: number }>;
}
