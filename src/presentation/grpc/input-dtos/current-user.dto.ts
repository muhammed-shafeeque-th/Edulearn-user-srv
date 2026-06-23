import { IsString } from "class-validator";

export default class CurrentUserDto {
  @IsString({ message: "userId must be string" })
  userId: string;
}
