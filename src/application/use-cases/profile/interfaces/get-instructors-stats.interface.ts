import { InstructorsStats } from "src/infrastructure/grpc/generated/user/types/stats_types";

export abstract class IGetInstructorsStatsUseCase {
  abstract execute(): Promise<InstructorsStats>;
}
