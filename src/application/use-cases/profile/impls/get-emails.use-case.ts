import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IGetAllEmailsUseCase } from "../interfaces/get-emails.interface";

@Injectable()
export default class GetAllEmailsUseCaseImpl implements IGetAllEmailsUseCase {
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(): Promise<string[]> {
    return await this._tracer.startActiveSpan(
      "GetAllEmailsUseCaseImpl.execute",
      async (span) => {
        this._logger.debug(`Executing GetAllEmailsUseCaseImpl `);
        const userEmails = await this._userRepository.findAllUsersEmail();

        return userEmails;
      },
    );
  }
}
