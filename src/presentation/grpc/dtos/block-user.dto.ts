import { IsString } from 'class-validator';
import { BlockUserRequest } from 'src/infrastructure/grpc/generated/user/types/user_types';

export default class BlockUserDto implements BlockUserRequest {
  @IsString({ message: 'userId must be string' })
  userId: string;
}
