
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { UpdateUserDetailsRequest, UserSocialsData } from 'src/infrastructure/grpc/generated/user/types/user_types';

export default class UpdateUserDto implements UpdateUserDetailsRequest {
  @IsUUID(undefined, { message: '`userId` must be type UUID' })
  userId!: string;

  // @IsOptional()
  @IsString({ message: 'Must be type string' })
  firstName?: string ;

  @IsOptional()
  @IsString({ message: 'Must be type string' })
  lastName?: string | undefined;

  // @IsEnum(UserRoles)
  // role!: UserRoles;

  // @IsString({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  // status: UserStatus;

  // @IsOptional()
  // @IsString()
  // headline?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  language?: string;


  @IsOptional()
  @IsString({ message: 'Must be type string' })
  phone?: string | undefined;

  @IsOptional()
  @IsString({ message: 'Must be type string' })
  avatar?: string | undefined;
  
  @IsOptional()
  @IsString({ message: 'Must be type string' })
  city?: string;
  
  @IsOptional()
  @IsString({ message: 'Must be type string' })
  country?: string;
  
  @IsOptional()
  @IsString({ message: 'Must be type string' })
  gender?: string;

  socials: UserSocialsData[];



}
