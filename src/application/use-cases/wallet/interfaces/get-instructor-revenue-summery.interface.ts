import {
  GetInstructorRevenueSummeryRequest,
  InstructorRevenueSummery,
} from "src/infrastructure/grpc/generated/user/types/stats_types";

export abstract class IGetInstructorRevenueSummeryUseCase {
  /**
   * Fetch instructor's revenue summary information.
   * @param dto Information about the instructor.
   */
  abstract execute(
    dto: GetInstructorRevenueSummeryRequest,
  ): Promise<InstructorRevenueSummery>;
}
