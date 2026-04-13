import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { UserOrmEntity } from "../entities/user.orm-entity";
import {
  FindFilters,
  GrowthTrend,
  IUserRepository,
} from "src/domain/repositories/user.repository";
import { RedisService } from "src/infrastructure/redis/redis.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";
import User, { UserRoles, UserStatus } from "src/domain/entities/user-entity";
import { InstructorProfileOrmEntity } from "../entities/instructor-profile.orm-entity";
import { UserProfileOrmEntity } from "../entities/user-profile-orm.entiry";
import { UserSocialOrmEntity } from "../entities/socials.orm-entity";
import { EntityMapper } from "../mapper/entity-mapper";

Injectable();
export default class UserTypeOrmRepositoryImpl implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
    private readonly cache: RedisService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
    private readonly metrics: MetricsService,
  ) {}

  public async save(user: User): Promise<User> {
    return await this.tracer.startActiveSpan(
      "PostgresUserRepository.create",
      async (span) => {
        span.setAttributes({
          "db.operation": "insert",
          "user.email": user.email,
        });

        this.logger.debug(
          `Creating user in database with email: ${user.email}`,
        );
        try {
          const ormUser = EntityMapper.toOrmUser(user);
          const newUser = this.repo.create(ormUser);
          const savedUser = await this.repo.save(newUser);

          if (savedUser) {
            this.logger.debug(
              `User created successfully with ID: ${savedUser.id}`,
            );
            span.setAttribute("User.created", true);
            await Promise.allSettled([
              this.cache.set(`db:user:${savedUser.id}`, savedUser, 3600),
              ...(savedUser.slug
                ? [
                    this.cache.set(
                      `db:user:slug:${savedUser.slug}`,
                      savedUser,
                      3600,
                    ),
                  ]
                : []),
              this.cache.set(
                `db:user:email:${savedUser.email}`,
                savedUser,
                3600,
              ),
            ]);
          } else {
            this.logger.debug(
              `Failed to create user with email: ${user.email}`,
            );
            span.setAttribute("User.created", false);
          }
          return EntityMapper.toDomainUser(savedUser);
        } catch (error) {
          this.logger.warn(`Error creating user with email: ${user.email}`, {
            error,
          });
          throw error;
        }
      },
    );
  }

  public async findById(userId: string): Promise<User | null> {
    try {
      return await this.tracer.startActiveSpan(
        "PostgresUserRepository.findById",
        async (span) => {
          span.setAttributes({
            "db.operation": "select",
            "user.id": userId,
          });

          this.logger.debug(`Querying redis for user data with ID: ${userId}`);

          const cacheKey = `db:user:${userId}`;

          // Read-through cache: Check cache first
          const cachedUser = await this.cache.get<UserOrmEntity>(cacheKey);
          if (cachedUser) {
            this.logger.debug(`Redis cache hit for user with ID: ${userId}`);
            span.setAttribute("cache.hit", true);
            return EntityMapper.toDomainUser(cachedUser);
          }
          this.logger.debug(`Redis cache miss for user with ID: ${userId}`);
          span.setAttribute("cache.hit", false);

          // Fetch from db if not in cache
          this.logger.debug(
            "Querying database for user data with ID: " + userId,
          );
          const endTimer = this.metrics.measureDBOperationDuration(
            "findById",
            "SELECT",
          );
          this.metrics.incrementDBRequestCounter("SELECT");
          const user = await this.repo.findOne({
            where: { id: userId },
            relations: ["socials", "profile", "instructorProfile"],
          });
          endTimer();
          if (user) {
            this.logger.debug("User found in DB with ID: " + userId);
            span.setAttribute("User.found", true);
            await this.cache.set(cacheKey, user); // Cache the result
          } else {
            this.logger.debug("User not found in DB with ID: " + userId);
            span.setAttribute("User.found", false);
          }
          return user ? EntityMapper.toDomainUser(user) : null;
        },
      );
    } catch (error) {
      this.logger.warn(`Error fetching user ${userId}`, { error });
      throw error;
    }
  }

  public async findByUserSlug(slug: string): Promise<User | null> {
    try {
      return await this.tracer.startActiveSpan(
        "PostgresUserRepository.findByUserSlug",
        async (span) => {
          span.setAttributes({
            "db.operation": "select",
            "user.name": slug,
          });
          const cacheKey = `db:user:slug:${slug}`;

          this.logger.debug(`Querying redis for user data with name: ${slug}`);

          // Read-through cache: Check cache first
          const cachedUser = await this.cache.get<UserOrmEntity>(cacheKey);
          if (cachedUser) {
            this.logger.debug(`Redis cache hit for user with name: ${slug}`);
            span.setAttribute("cache.hit", true);
            return EntityMapper.toDomainUser(cachedUser);
          }
          this.logger.debug(`Redis cache miss for user with name: ${slug}`);
          span.setAttribute("cache.hit", false);

          // Fetch from db if not in cache
          this.logger.debug(
            "Querying database for user data with name: " + slug,
          );
          const endTimer = this.metrics.measureDBOperationDuration(
            "findByUserSlug",
            "SELECT",
          );
          this.metrics.incrementDBRequestCounter("SELECT");
          const user = await this.repo.findOne({
            where: { slug },
            relations: ["socials", "profile", "instructorProfile"],
          });
          endTimer();
          if (user) {
            this.logger.debug("User found in DB with name: " + slug);
            span.setAttribute("User.found", true);
            await this.cache.set(cacheKey, user); // Cache the result
          } else {
            this.logger.debug("User not found in DB with name: " + slug);
            span.setAttribute("User.found", false);
          }
          return user ? EntityMapper.toDomainUser(user) : null;
        },
      );
    } catch (error) {
      this.logger.warn(`Error fetching user ${slug}`, { error });
      throw error;
    }
  }

  public async findWithRelations(userId: string): Promise<User | null> {
    try {
      return await this.tracer.startActiveSpan(
        "PostgresUserRepository.findWithRelations",
        async (span) => {
          span.setAttributes({
            "db.operation": "select",
            "user.id": userId,
          });

          this.logger.debug(`Querying redis for user data with ID: ${userId}`);

          const cacheKey = `db:user:relations:${userId}`;
          // Read-through cache: Check cache first
          const cachedUser = await this.cache.get<UserOrmEntity>(cacheKey);
          if (cachedUser) {
            this.logger.debug(`Redis cache hit for user with ID: ${userId}`);
            span.setAttribute("cache.hit", true);
            return EntityMapper.toDomainUser(cachedUser);
          }

          // Fetch from db if not in cache
          this.logger.debug(
            "Querying database for user data with ID: " + userId,
          );
          const endTimer = this.metrics.measureDBOperationDuration(
            "findWithRelations",
            "SELECT",
          );
          this.metrics.incrementDBRequestCounter("SELECT");
          const user = await this.repo.findOne({
            where: { id: userId },
            relations: [
              "wishlist",
              "cart",
              "socials",
              "profile",
              "instructorProfile",
            ],
            // select: ['id', 'avatar', 'status', 'email', 'role'],
          });
          endTimer();
          if (user) {
            this.logger.debug("User found in DB with ID: " + userId);
            span.setAttribute("User.found", true);
            await this.cache.set(cacheKey, user); // Cache the result
          } else {
            this.logger.debug("User not found in DB with ID: " + userId);
            span.setAttribute("User.found", false);
          }
          return user ? EntityMapper.toDomainUser(user) : null;
        },
      );
    } catch (error) {
      this.logger.warn(`Error fetching user ${userId}`, { error });
      throw error;
    }
  }

  public async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.tracer.startActiveSpan(
        "PostgresUserRepository.findByEmail",
        async (span) => {
          span.setAttributes({
            "db.operation": "select",
            "user.email": email,
          });
          const cacheKey = `db:user:email:${email}`;
          this.logger.debug(`Fetching user from database with email: ${email}`);
          const cachedUser = await this.cache.get<UserOrmEntity>(cacheKey);
          if (cachedUser) {
            this.logger.debug(`Redis cache hit for user with email: ${email}`);
            return EntityMapper.toDomainUser(cachedUser);
          }

          const endTimer = this.metrics.measureDBOperationDuration(
            "findByEmail",
            "SELECT",
          );
          this.metrics.incrementDBRequestCounter("SELECT");
          const user = await this.repo.findOne({
            where: { email },
            relations: ["socials", "profile", "instructorProfile"],
          });
          endTimer();

          if (user) {
            this.logger.debug(`User found in DB with email: ${email}`);
            span.setAttribute("User.found", true);
            await this.cache.set(cacheKey, user, 3600);
          } else {
            this.logger.debug(`User not found in DB with email: ${email}`);
            span.setAttribute("User.found", false);
          }
          return user ? EntityMapper.toDomainUser(user) : null;
        },
      );
    } catch (error) {
      this.logger.warn(`Error fetching user with email: ${email}`, {
        error,
      });
      throw error;
    }
  }

  // public async delete(userId: string): Promise<void> {
  //   return await this.tracer.startActiveSpan(
  //     "PostgresUserRepository.delete",
  //     async (span) => {
  //       span.setAttributes({
  //         "db.operation": "update",
  //         "user.id": userId,
  //       });
  //       this.logger.debug(`Deleting user from database with ID: ${userId}`);
  //       try {
  //         const endTimer = this.metrics.measureDBOperationDuration(
  //           "delete",
  //           "DELETE"
  //         );
  //         this.metrics.incrementDBRequestCounter("DELETE");
  //         const [, userResponse] = await Promise.allSettled([
  //           this.repo.update({ id: userId }, { status: UserStatus.BLOCKED }),
  //           this.repo.findOne({ where: { id: userId } }),
  //         ]);
  //         endTimer();

  //         const operations = [
  //           this.cache.del(`db:user:${userId}`),
  //           this.cache.del(`db:users:page:*`),
  //         ];

  //         if (userResponse.status === "fulfilled" && userResponse.value) {
  //           const user = userResponse.value;
  //           operations.push(this.cache.del(`db:user:email:${user.email}`));
  //         }

  //         await Promise.all(operations);
  //         this.logger.debug(`User deleted successfully with ID: ${userId}`);
  //         span.setAttribute("User.deleted", true);
  //       } catch (error) {
  //         this.logger.warn(`Error deleting user with ID: ${userId}`, { error });
  //         this.tracer.recordException(span, error);
  //         throw error;
  //       }
  //     }
  //   );
  // }

  public async update(userId: string, data: User): Promise<User> {
    try {
      return await this.tracer.startActiveSpan(
        "PostgresUserRepository.update",
        async (span) => {
          span.setAttributes({
            "db.operation": "update",
            "user.id": userId,
          });
          this.logger.debug(`Updating user in database with ID: ${userId}`);

          // Get the existing user first
          const existingUser = await this.repo.findOne({
            where: { id: userId },
            relations: ["socials", "profile", "instructorProfile"],
          });

          if (!existingUser) {
            throw new Error(`User with ID ${userId} not found`);
          }

          // Map domain user to ORM entity, excluding relationships for now
          const modelData = EntityMapper.toOrmUser(data as User);

          // Remove relationships from the update data since we'll handle them separately
          const { socials, profile, instructorProfile, ...updateData } =
            modelData;

          const endTimer = this.metrics.measureDBOperationDuration(
            "update",
            "UPDATE",
          );
          this.metrics.incrementDBRequestCounter("UPDATE");

          // Update the main user entity (without relationships)
          await this.repo.update({ id: userId }, updateData);

          // Handle profile separately if it exists
          if (profile) {
            // Use upsert approach: update if exists, insert if not
            await this.repo.manager.upsert(UserProfileOrmEntity, profile, {
              conflictPaths: ["userId"],
              skipUpdateIfNoValuesChanged: true,
            });
          }

          // Handle instructor profile separately if it exists
          if (instructorProfile) {
            // Use upsert approach: update if exists, insert if not
            await this.repo.manager.upsert(
              InstructorProfileOrmEntity,
              instructorProfile,
              {
                conflictPaths: ["userId"],
                skipUpdateIfNoValuesChanged: true,
              },
            );
          }

          // Handle socials separately if they exist
          if (socials && socials.length > 0) {
            // Remove existing socials
            if (existingUser.socials && existingUser.socials.length > 0) {
              await this.repo.manager.delete(UserSocialOrmEntity, { userId });
            }

            // Insert new socials
            await this.repo.manager.save(UserSocialOrmEntity, socials);
          }

          // Fetch the updated user with all relations
          const updatedUser = await this.repo.findOne({
            where: { id: userId },
            relations: ["socials", "profile", "instructorProfile"],
          });
          endTimer();
          const mappedDomain = EntityMapper.toDomainUser(updatedUser);

          if (updatedUser) {
            this.logger.debug(`User updated successfully with ID: ${userId}`);
            span.setAttribute("User.updated", true);
            await Promise.all([
              this.cache.set(`db:user:${userId}`, updatedUser, 3600),
              ...(updatedUser.slug
                ? [
                    this.cache.set(
                      `db:user:slug:${updatedUser.slug}`,
                      updatedUser,
                      3600,
                    ),
                  ]
                : []),
              this.cache.set(
                `db:user:email:${updatedUser.email}`,
                updatedUser,
                3600,
              ),
            ]);
          } else {
            this.logger.debug(`Failed to update user with ID: ${userId}`);
            span.setAttribute("User.updated", false);
          }
          return updatedUser ? EntityMapper.toDomainUser(updatedUser) : null;
        },
      );
    } catch (error) {
      this.logger.warn(`Error updating user with ID: ${userId}`, { error });
      throw error;
    }
  }

  public async findAllUsersEmail(): Promise<string[]> {
    try {
      return await this.tracer.startActiveSpan(
        "PostgresUserRepository.getAllUserEmails",
        async (span) => {
          span.setAttributes({
            "db.operation": "select",
          });
          this.logger.debug("Fetching all user emails from database");
          const endTimer = this.metrics.measureDBOperationDuration(
            "getAllUserEmails",
            "SELECT",
          );
          this.metrics.incrementDBRequestCounter("SELECT");
          const emails = await this.repo.find({ select: ["email"] });
          endTimer();

          this.logger.debug("Fetched all user emails successfully");
          span.setAttribute("UserEmails.found", true);
          return emails.map((user) => user.email);
        },
      );
    } catch (error) {
      this.logger.warn("Error fetching all user emails", { error });
      throw error;
    }
  }

  public async findInstructors(
    filters: FindFilters,
  ): Promise<{ instructors: User[]; totalInstructors: number }> {
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 12;
    const sortField = filters.sortField || "createdAt";
    const sortOrder = filters.sortOrder || "DESC";

    try {
      return await this.tracer.startActiveSpan(
        "PostgresUserRepository.getAllInstructors",
        async (span) => {
          span.setAttributes({
            "db.operation": "select",
            "query.limit": limit,
            "query.offset": offset,
          });

          // Build cache key based on all filters
          const cacheKeyParts = [
            `db:instructors`,
            `limit:${limit}`,
            `offset:${offset}`,
            `sort:${sortField}:${sortOrder}`,
          ];
          if (filters.search) cacheKeyParts.push(`search:${filters.search}`);
          if (filters.status) cacheKeyParts.push(`status:${filters.status}`);

          const cacheKey = cacheKeyParts.join("|");

          this.logger.debug(
            `Redis cache hit for instructors with limit: ${limit}, offset: ${offset}`,
          );

          const cacheResult = await this.cache.get<{
            instructors: UserOrmEntity[];
            totalInstructors: number;
          }>(cacheKey);

          if (cacheResult) {
            this.logger.debug(
              `Redis cache hit for instructors with limit: ${limit}, offset: ${offset}`,
            );
            span.setAttribute("cache.hit", true);
            return {
              instructors: cacheResult.instructors.map(
                EntityMapper.toDomainUser,
              ),
              totalInstructors: cacheResult.totalInstructors,
            };
          }
          this.logger.debug(
            `Redis cache miss for instructors with limit: ${limit}, offset: ${offset}`,
          );
          span.setAttribute("cache.hit", false);

          const endTimer = this.metrics.measureDBOperationDuration(
            "getAllInstructors",
            "SELECT",
          );
          this.metrics.incrementDBRequestCounter("SELECT");

          const qb = this.repo
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.profile", "profile")
            .leftJoinAndSelect("user.socials", "socials")
            .leftJoinAndSelect("user.instructorProfile", "instructorProfile")
            .where(":role = ANY(user.roles)", { role: UserRoles.INSTRUCTOR });

          if (filters.status) {
            qb.andWhere("user.status = :status", { status: filters.status });
          }

          if (filters.email) {
            qb.andWhere("user.email ILIKE :email", {
              email: `%${filters.email}%`,
            });
          }

          if (filters.search) {
            const search = `%${filters.search}%`;
            qb.andWhere(
              new Brackets((qb) => {
                qb.where("user.firstName ILIKE :search", { search })
                  .orWhere("user.lastName ILIKE :search", { search })
                  // .orWhere("user.email ILIKE :search", { search })
                  .orWhere("user.username ILIKE :search", { search });
              }),
            );
          }

          qb.orderBy(`user.${sortField}`, sortOrder as "ASC" | "DESC")
            .skip(offset)
            .take(limit);

          const [instructors, totalInstructors] = await qb.getManyAndCount();

          endTimer();

          // Cache for 5 minutes
          await this.cache.set(
            cacheKey,
            { instructors, totalInstructors },
            300,
          );

          this.logger.debug(
            `Fetched instructors successfully from DB with limit: ${limit}, offset: ${offset}`,
          );
          span.setAttribute("Instructors.found", true);
          return {
            instructors: instructors.map(EntityMapper.toDomainUser),
            totalInstructors,
          };
        },
      );
    } catch (error) {
      this.logger.warn(
        `Error fetching instructors with limit: ${limit}, offset: ${offset}`,
        {
          error,
        },
      );
      throw error;
    }
  }

  public async findUsersByIds(ids: string[]): Promise<User[]> {
    try {
      return await this.tracer.startActiveSpan(
        "PostgresUserRepository.findUsersByIds",
        async (span) => {
          span.setAttributes({
            "db.operation": "select",
          });
          this.logger.debug(
            `Fetching users from database with ids length: ${ids.length}`,
          );
          const cacheKey = `db:users:ids:${ids.join(",")}`;
          const cachedUsers = await this.cache.get<UserOrmEntity[]>(cacheKey);
          if (cachedUsers) {
            this.logger.debug(`Redis cache hit for users with ids`);
            return cachedUsers.map(EntityMapper.toDomainUser);
          }

          const endTimer = this.metrics.measureDBOperationDuration(
            "findUsersByIds",
            "SELECT",
          );
          this.metrics.incrementDBRequestCounter("SELECT");
          const users = await this.repo
            .createQueryBuilder("user")
            .where("user.id IN (:...ids)", { ids })
            .getMany();

          endTimer();

          await this.cache.set(cacheKey, users, 300);
          this.logger.debug(
            `Fetched users successfully from DB with length: ${users.length}`,
          );
          span.setAttribute("Users.found", true);
          return users.map(EntityMapper.toDomainUser);
        },
      );
    } catch (error) {
      this.logger.warn(`Error fetching users with length: ${ids.length}`, {
        error,
      });
      throw error;
    }
  }

  public async findUsers(
    filters: FindFilters,
  ): Promise<{ users: User[]; totalUsers: number }> {
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 20;
    const sortField = filters.sortField || "createdAt";
    const sortOrder = filters.sortOrder || "DESC";
    const cacheKey = [
      `db:users`,
      `limit:${limit}`,
      `offset:${offset}`,
      `sort:${sortField},${sortOrder}`,
      filters.status ? `status:${filters.status}` : "",
      filters.role ? `role:${filters.role}` : "",
      filters.email ? `email:${filters.email}` : "",
      filters.search ? `search:${filters.search}` : "",
    ]
      .filter(Boolean)
      .join("|");

    try {
      return await this.tracer.startActiveSpan(
        "PostgresUserRepository.findUsers",
        async (span) => {
          span.setAttributes({
            "db.operation": "select",
            "query.limit": limit,
            "query.offset": offset,
            "query.sortField": sortField,
            "query.sortOrder": sortOrder,
            ...(filters.status && { "query.status": filters.status }),
            ...(filters.role && { "query.role": filters.role }),
            ...(filters.email && { "query.email": filters.email }),
            ...(filters.search && { "query.search": filters.search }),
          });
          this.logger.debug(
            `Fetching users from database with limit: ${limit}, offset: ${offset}, sort: ${sortField}, order: ${sortOrder}`,
          );

          // Try cache first
          const cacheResult = await this.cache.get<{
            users: UserOrmEntity[];
            totalUsers: number;
          }>(cacheKey);

          if (cacheResult && cacheResult.users) {
            this.logger.debug(
              `Redis cache hit for users with limit: ${limit}, offset: ${offset}`,
            );
            span.setAttribute("Redis.users.cache.hit", true);
            return {
              users: cacheResult.users.map(EntityMapper.toDomainUser),
              totalUsers: cacheResult.totalUsers,
            };
          }

          this.logger.debug(
            `Redis cache miss for users with limit: ${limit}, offset: ${offset}`,
          );
          span.setAttribute("Redis.users.cache.hit", false);

          const endTimer = this.metrics.measureDBOperationDuration(
            "findUsers",
            "SELECT",
          );
          this.metrics.incrementDBRequestCounter("SELECT");

          // Dynamic query building for flexible filters and search
          const qb = this.repo
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.profile", "profile")
            .leftJoinAndSelect("user.instructorProfile", "instructorProfile")
            .leftJoinAndSelect("user.socials", "socials")
            .skip(offset)
            .take(limit);

          // Sorting
          qb.orderBy(`user.${sortField}`, sortOrder as "ASC" | "DESC");

          // Conditional filters
          if (filters.status) {
            qb.andWhere("user.status = :status", { status: filters.status });
          }
          if (filters.role) {
            qb.andWhere(":role = ANY(user.roles)", { role: filters.role });
          }
          if (filters.email) {
            qb.andWhere("user.email ILIKE :email", {
              email: `%${filters.email}%`,
            });
          }
          // Search by multiple fields
          if (filters.search) {
            const search = `%${filters.search}%`;
            qb.andWhere(
              new Brackets((qb) => {
                qb.where("user.firstName ILIKE :search", { search })
                  .orWhere("user.lastName ILIKE :search", { search })
                  .orWhere("user.username ILIKE :search", { search })
                  // .orWhere("user.email ILIKE :search", { search });
              }),
            );
          }

          // Fetch records with count
          const [users, totalUsers] = await qb.getManyAndCount();
          endTimer();

          console.log(
            JSON.stringify("users data : " + { users, totalUsers }, null, 2),
          );

          // Cache result
          await this.cache.set(cacheKey, { users, totalUsers }, 300);
          this.logger.debug(
            `Fetched users successfully from DB with limit: ${limit}, offset: ${offset}, total: ${totalUsers}`,
          );
          span.setAttribute("Users.found", true);
          return { users: users.map(EntityMapper.toDomainUser), totalUsers };
        },
      );
    } catch (error) {
      this.logger.warn(
        `Error fetching users with limit: ${filters.limit}, offset: ${filters.offset}`,
        {
          error,
        },
      );
      throw error;
    }
  }

  async getInstructorsStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    newThisMonth: number;
  }> {
    try {
      return await this.tracer.startActiveSpan(
        "UserTypeOrmRepositoryImpl.getInstructorsStats",
        async (span) => {
          const now = new Date();
          const firstDayOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
          );

          const qb = this.repo
            .createQueryBuilder("user")
            .select([
              'COUNT("user"."id") as total',
              `SUM(CASE WHEN "user"."roleStatusMap"->>'instructor' = :active THEN 1 ELSE 0 END) as active`,
              `SUM(CASE WHEN "user"."roleStatusMap"->>'instructor' = :suspended THEN 1 ELSE 0 END) as inactive`,
              `SUM(CASE WHEN "user"."roleStatusMap"->>'instructor' = :blocked THEN 1 ELSE 0 END) as blocked`,
              'SUM(CASE WHEN "user"."createdAt" >= :firstDayOfMonth THEN 1 ELSE 0 END) as "newThisMonth"',
            ])
            .where(":role = ANY(user.roles)", { role: UserRoles.INSTRUCTOR })
            .setParameters({
              active: 'active',
              suspended: 'suspended',
              blocked: 'blocked',
              firstDayOfMonth,
            });

          const row = await qb.getRawOne();
          return {
            total: Number(row.total) || 0,
            active: Number(row.active) || 0,
            inactive: Number(row.inactive) || 0,
            blocked: Number(row.blocked) || 0,
            newThisMonth: Number(row.newThisMonth) || 0,
          };
        },
      );
    } catch (error) {
      this.logger.error("Failed to get instructor stats", { error });
      throw error;
    }
  }

  async getInstructorsGrowthTrend(year: number): Promise<GrowthTrend> {
    try {
      const raw = await this.repo
        .createQueryBuilder("user")
        .select('EXTRACT(MONTH FROM "user"."createdAt")', "month")
        .addSelect('COUNT("user"."id")', "count")
        .where('EXTRACT(YEAR FROM "user"."createdAt") = :year', { year })
        .andWhere(":role = ANY(user.roles)", { role: UserRoles.INSTRUCTOR })
        .groupBy("month")
        .getRawMany();

      return {
        trend: raw.map((row) => ({
          month: Number(row.month) - 1,
          count: Number(row.count),
        })),
      };
    } catch (error) {
      this.logger.error("Failed to get instructor growth trend", { error });
      throw error;
    }
  }

  async getUsersGrowthTrend(year: number): Promise<GrowthTrend> {
    try {
      const raw = await this.repo
        .createQueryBuilder("user")
        .select('EXTRACT(MONTH FROM "user"."createdAt")', "month")
        .addSelect('COUNT("user"."id")', "count")
        .where('EXTRACT(YEAR FROM "user"."createdAt") = :year', { year })
        .groupBy("month")
        .getRawMany();

      return {
        trend: raw.map((row) => ({
          month: Number(row.month) - 1,
          count: Number(row.count),
        })),
      };
    } catch (error) {
      this.logger.error("Failed to get user growth trend", { error });
      throw error;
    }
  }

  async getUsersStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    blocked: number;
  }> {
    try {
      return await this.tracer.startActiveSpan(
        "UserTypeOrmRepositoryImpl.getUsersStats",
        async (span) => {
          const qb = this.repo
            .createQueryBuilder("user")
            .select([
              "COUNT(user.id) as total",
              `SUM(CASE WHEN "user"."status" IN (:...activeStatuses) THEN 1 ELSE 0 END) as active`,
              "SUM(CASE WHEN user.status = :inactive THEN 1 ELSE 0 END) as inactive",
              "SUM(CASE WHEN user.status = :blocked THEN 1 ELSE 0 END) as blocked",
            ])
            .setParameters({
              activeStatuses: [UserStatus.ACTIVE, UserStatus.VERIFIED],
              inactive: UserStatus.NOT_ACTIVE,
              blocked: UserStatus.BLOCKED,
            });

          const row = await qb.getRawOne();
          console.log("users stats : " + JSON.stringify(row, null, 2));

          return {
            total: Number(row.total) || 0,
            active: Number(row.active) || 0,
            inactive: Number(row.inactive) || 0,
            blocked: Number(row.blocked) || 0,
          };
        },
      );
    } catch (error) {
      this.logger.error("Failed to get user stats", { error });
      throw error;
    }
  }
}
