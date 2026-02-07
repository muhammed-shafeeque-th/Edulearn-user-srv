import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export default class GetAllEmailsUseCaseImpl  {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}
  public async execute(): Promise<string[]> {
    return await this.tracer.startActiveSpan(
      "GetAllEmailsUseCaseImpl.execute",
      async (span) => {
        this.logger.info(`Executing GetAllEmailsUseCaseImpl `);
        const userEmails = await this.userRepository.findAllUsersEmail();

        return userEmails;
      }
    );
  }
}
