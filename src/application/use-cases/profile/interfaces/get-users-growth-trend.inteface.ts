import { GrowthTrend } from "src/domain/repositories/user.repository";

export abstract class IGetUsersGrowthTrendUseCase {
  abstract execute(year: number): Promise<GrowthTrend>;
}
