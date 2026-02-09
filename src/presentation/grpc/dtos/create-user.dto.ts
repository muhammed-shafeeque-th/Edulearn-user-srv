import { IsDate, IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { UserRoles, UserStatus } from "src/domain/entities/_user.entity";

export default class CreateUserDto {
  @IsString({ message: "userId must be string" })
  userId: string;
  
  @IsString({ message: "userId must be string" })
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString({ message: "Must be type string" })
  firstName?: string | undefined;

  @IsOptional()
  @IsString({ message: "Must be type string" })
  lastName?: string | undefined;
  
  @IsOptional()
  @IsString({ message: "Must be type string" })
  avatar?: string | undefined;

  @IsEnum(UserRoles)
  role!: UserRoles;

  @IsEnum({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @IsString()
  @IsOptional()
  createdAt: Date;
}
