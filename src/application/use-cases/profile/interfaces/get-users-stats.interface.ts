import { UsersStats } from "src/infrastructure/grpc/generated/user/types/stats_types";

export abstract class IGetUsersStatsUseCase {
  abstract execute(): Promise<UsersStats>;
}
