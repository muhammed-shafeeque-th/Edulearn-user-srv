import { IsEmail } from 'class-validator';

export default class EmailExistDto {
  @IsEmail()
  email: string;
}
