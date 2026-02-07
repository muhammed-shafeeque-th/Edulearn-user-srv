import { IsBoolean, IsString, IsUUID } from "class-validator";
import { RegisterInstructorRequest } from "src/infrastructure/grpc/generated/user/types/instructor_types";

export default class RegisterInstructorDto
  implements RegisterInstructorRequest
{
  @IsUUID(undefined, { message: "`userId` must be type UUID" })
  userId!: string;

  @IsString({ message: "Must be type string" })
  username: string;

  tags: string[];

  @IsBoolean()
  agreeToTerms: boolean;

  @IsBoolean()
  receiveUpdates: boolean;

  @IsBoolean()
  agreeToPrivacy: boolean;

  @IsString()
  expertise: string;

  @IsString()
  experience: string;

  @IsString()
  education: string;

  @IsString()
  headline: string;

  @IsString()
  biography: string;

  @IsString()
  language: string;
}
