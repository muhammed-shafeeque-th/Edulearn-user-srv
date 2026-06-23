import EmailExistDto from "@/presentation/grpc/input-dtos/email-exist.dto";

export abstract class ICheckEmailExistUseCase {
  abstract execute(dto: EmailExistDto): Promise<boolean>;
}
