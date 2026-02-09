import { UserRoles, UserStatus } from "src/domain/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserConnectionOrmEntity } from "./connection-orm-entity";
import { UserProfileOrmEntity } from "./user-profile-orm.entiry";
import { UserSocialOrmEntity } from "./socials.orm-entity";
import { InstructorProfileOrmEntity } from "./instructor-profile.orm-entity";
import { CartOrmEntity } from "./cart.orm-entity";
import { WishlistOrmEntity } from "./wishlist.orm-entity";
import { WalletOrmEntity } from "./wallet.orm-entity";
import { InstructorStudentOrmEntity } from "./instructor-student.orm-entity";

@Entity("users")
export class UserOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email!: string;

  @Index({ unique: true })
  @Column({ unique: true, nullable: true })
  username?: string;

  @Index({ unique: true })
  @Column({ unique: true, nullable: true })
  slug?: string;

  // @Column({ nullable: true })
  // passwordHash?: string;

  @Column({ type: "enum", enum: UserRoles, default: "student" })
  role!: UserRoles;

  @Column({ type: "enum", enum: UserStatus, default: "active" })
  status!: UserStatus;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ type: "timestamptz", nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;


  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => WalletOrmEntity, (p) => p.user, {
    cascade: true,
    // eager: true,
    nullable: true,
  })
  wallet?: WalletOrmEntity;
  @OneToOne(() => UserProfileOrmEntity, (p) => p.user, {
    cascade: true,
    // eager: true,
    nullable: true,
  })
  profile?: UserProfileOrmEntity;

  @OneToMany(() => UserSocialOrmEntity, (s) => s.user, {
    cascade: true,
    nullable: true,
  })
  socials?: UserSocialOrmEntity[];

  @OneToOne(() => InstructorProfileOrmEntity, (i) => i.user, {
    cascade: true,
    // eager: true,
    nullable: true,
  })
  instructorProfile?: InstructorProfileOrmEntity;

  //   @OneToMany(() => UserBadgeOrmEntity, (b) => b.user)
  //   badges?: UserBadgeOrmEntity[];

  //   @OneToMany(() => UserActivityLogOrmEntity, (l) => l.user)
  //   activityLogs?: UserActivityLogOrmEntity[];

  @OneToMany(() => UserConnectionOrmEntity, (c) => c.follower, {
    nullable: true,
  })
  connections?: UserConnectionOrmEntity[];

  // @OneToMany(() => OrganizationMemberOrmEntity, (m) => m.user)
  // organizations?: OrganizationMemberOrmEntity[];

  @OneToMany(() => CartOrmEntity, (cart) => cart.user, {
    cascade: true,
  })
  cart: CartOrmEntity[];

  @OneToMany(() => WishlistOrmEntity, (wishlist) => wishlist.user, {
    cascade: true,
  })
  wishlist: WishlistOrmEntity[];

  @OneToMany(() => InstructorStudentOrmEntity, (rel) => rel.instructor)
students?: InstructorStudentOrmEntity[];

@OneToMany(() => InstructorStudentOrmEntity, (rel) => rel.student)
instructors?: InstructorStudentOrmEntity[];
}
