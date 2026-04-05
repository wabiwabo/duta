import { UserEntity } from '../entities/user.entity';

export interface UserRepository {
  findByLogtoId(logtoId: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  upsertByLogtoId(logtoId: string, data: Partial<UserEntity>): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
