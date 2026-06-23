import { Injectable } from "@nestjs/common";
import EmailExistDto from "src/presentation/grpc/dtos/email-exist.dto";

export abstract class ICheckEmailExistUseCase {
  abstract execute(dto: EmailExistDto): Promise<boolean>;
}
