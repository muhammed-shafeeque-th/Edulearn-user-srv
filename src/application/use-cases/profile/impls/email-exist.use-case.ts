import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import EmailExistDto from "@/presentation/grpc/input-dtos/email-exist.dto";
import { ICheckEmailExistUseCase } from "../interfaces/email-exist.interface";

@Injectable()
export default class CheckEmailExistUseCaseImpl
  implements ICheckEmailExistUseCase
{
  public constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: EmailExistDto): Promise<boolean> {
    return await this._tracer.startActiveSpan(
      "CheckEmailExistUseCaseImpl.execute",
      async () => {
        this._logger.debug(`Executing CheckEmailExistUseCaseImpl `);
        // Checks users with limit and offset
        const user = await this._userRepository.findByEmail(dto.email);

        return !!user;
      },
    );
  }
}
