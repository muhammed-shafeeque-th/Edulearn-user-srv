import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import EmailExistDto from "src/presentation/grpc/dtos/email-exist.dto";

@Injectable()
export default class CheckEmailExistUseCaseImpl {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}
  public async execute(dto: EmailExistDto): Promise<boolean> {
    return await this.tracer.startActiveSpan(
      "CheckEmailExistUseCaseImpl.execute",
      async (span) => {
        this.logger.info(`Executing CheckEmailExistUseCaseImpl `);
        // Checks users with limit and offset
        const user = await this.userRepository.findByEmail(dto.email);

        return !!user;
      }
    );
  }
}
