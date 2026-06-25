import { IsString } from "class-validator";

export default class GetUserByUsernameDto {
  @IsString({ message: "userId must be string" })
  username: string;
}
