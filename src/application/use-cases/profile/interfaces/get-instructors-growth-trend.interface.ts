import { GrowthTrend } from "src/domain/repositories/user.repository";

export abstract class IGetInstructorsGrowthTrendUseCase {
  abstract execute(year: number): Promise<GrowthTrend>;
}
