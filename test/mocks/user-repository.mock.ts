import User from "@/domain/entities/user-entity";
import {
  FindFilters,
  GrowthTrend,
  IUserRepository,
} from "@/domain/repositories/user.repository";

export class MockUserRepository extends IUserRepository {
  save = jest.fn<Promise<User>, [User]>();
  findById = jest.fn<Promise<User | null>, [string]>();
  findByEmail = jest.fn<Promise<User | null>, [string]>();
  findByUserSlug = jest.fn<Promise<User | null>, [string]>();
  findInstructors = jest.fn<
    Promise<{ instructors: User[]; totalInstructors: number }>,
    [FindFilters]
  >();
  findUsers = jest.fn<
    Promise<{ users: User[]; totalUsers: number }>,
    [FindFilters]
  >();
  findUsersByIds = jest.fn<Promise<User[]>, [string[]]>();
  findAllUsersEmail = jest.fn<Promise<string[]>, [number?, number?]>();
  update = jest.fn<Promise<User>, [string, User]>();
  findWithRelations = jest.fn<Promise<User | null>, [string]>();
  getUsersStats = jest.fn<
    Promise<{
      total: number;
      active: number;
      inactive: number;
      blocked: number;
    }>,
    []
  >();
  getInstructorsStats = jest.fn<
    Promise<{
      total: number;
      active: number;
      inactive: number;
      blocked: number;
      newThisMonth: number;
    }>,
    []
  >();
  getUsersGrowthTrend = jest.fn<Promise<GrowthTrend>, [number]>();
  getInstructorsGrowthTrend = jest.fn<Promise<GrowthTrend>, [number]>();
}

export function createMockUserRepository(): jest.Mocked<IUserRepository> {
  return new MockUserRepository();
}
