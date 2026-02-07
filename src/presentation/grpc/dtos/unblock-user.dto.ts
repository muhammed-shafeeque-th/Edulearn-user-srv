import { IsString } from 'class-validator';

export default class UnBlockUserDto {
  @IsString({ message: 'userId must be string' })
  userId: string;
}
