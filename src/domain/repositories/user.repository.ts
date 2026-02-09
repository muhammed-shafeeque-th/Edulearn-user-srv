import User from "../entities/user.entity";

export type UserSortField =
  | "id"
  | "email"
  | "firstName"
  | "lastName"
  | "role"
  | "status"
  | "createdAt"
  | "updatedAt";


export const DOMAIN_USER_FIELDS: UserSortField[] = [
  "id",
  "email",
  "firstName",
  "lastName",
  "role",
  "status",
  "createdAt",
  "updatedAt",
];

/**
 * Interface for user search and filter options.
 */
export interface FindFilters {
  /**
   * The page number (for pagination).
   */
  offset?: number;
  /**
   * The page size (for pagination).
   */
  limit?: number;
  /**
   * Sort order ('ASC' or 'DESC').
   */
  sortOrder?: "ASC" | "DESC";
  /**
   * The field to sort by.
   */
  sortField?: UserSortField;
  /**
   * Status filter for the user (e.g., 'ACTIVE', 'BLOCKED', etc.).
   */
  status?: string;
  /**
   * Filter users by email.
   */
  email?: string;
  /**
   * Role to filter users (e.g., 'instructor', 'student', etc.).
   */
  role?: string;
  /**
   * Search (for matching against name, email, etc.).
   */
  search?: string;
}

/**
 * Abstract repository that defines interface for User entity persistence and retrieval operations.
 */
export abstract class IUserRepository {
  /**
   * Persists a User entity.
   * @param user User entity to save.
   * @returns The saved User entity.
   */
  abstract save(user: User): Promise<User>;

  /**
   * Finds a user by their unique identifier.
   * @param id The user ID.
   * @returns The matching User entity or null if not found.
   */
  abstract findById(id: string): Promise<User | null>;

  /**
   * Finds a user by email address.
   * @param email The user's email.
   * @returns The matching User entity or null if not found.
   */
  abstract findByEmail(email: string): Promise<User | null>;

  /**
   * Finds a user by their slug/username.
   * @param slug The user's slug.
   * @returns The matching User entity or null if not found.
   */
  abstract findByUserSlug(slug: string): Promise<User | null>;

  /**
  /**
   * Retrieves a list of instructor users with pagination.
   * @param offset Number of records to skip before starting to collect the result set.
   * @param limit Maximum number of instructor records to return.
   * @returns An object containing the array of instructor users and total instructor count.
   */
  abstract findInstructors(
    offset: FindFilters["offset"],
    limit: FindFilters["limit"]
  ): Promise<{ instructors: User[]; totalInstructors: number }>;

  /**
   * Retrieves users matching given filters.
   * @param filter Search, pagination, and filter options.
   * @returns An object containing users and total user count.
   */
  abstract findUsers(
    filter: FindFilters
  ): Promise<{ users: User[]; totalUsers: number }>;

  /**
   * Finds users by a list of user IDs.
   * @param ids Array of user IDs.
   * @returns Array of User entities found.
   */
  abstract findUsersByIds(ids: string[]): Promise<User[]>;

  /**
   * Retrieves all users' email addresses with optional limit and offset.
   * @param limit Limit the number of results.
   * @param offset Number of results to skip.
   * @returns Array of email addresses.
   */
  abstract findAllUsersEmail(
    limit?: number,
    offset?: number
  ): Promise<string[]>;

  /**
   * Updates the user with the given ID.
   * @param userId The user ID.
   * @param user The user entity with updated fields.
   * @returns The updated User entity.
   */
  abstract update(userId: string, user: User): Promise<User>;

  /**
   * Finds a user along with related entities (relations).
   * @param userId User ID.
   * @returns User entity with populated relations, or null if not found.
   */
  abstract findWithRelations(userId: string): Promise<User | null>;

  /**
   * Retrieves aggregate statistics about users.
   * @returns An object containing the total number of users and instructors.
   */
  abstract getUsersStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    blocked: number;
  }>;

  /**
   * Retrieves statistics specifically about instructors.
   * @returns An object containing the total number of instructors and total users.
   */
  abstract getInstructorsStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    newThisMonth: number;
  }>;


}
