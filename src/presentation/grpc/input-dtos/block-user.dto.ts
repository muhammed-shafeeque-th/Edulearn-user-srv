import { IsString } from "class-validator";

export default class BlockUserDto {
  @IsString({ message: "userId must be string" })
  userId: string;
}
