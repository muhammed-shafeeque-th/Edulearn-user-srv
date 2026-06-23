import { IsString } from "class-validator";

export default class GetUserDto {
  @IsString({ message: "userId must be string" })
  userId: string;
}
