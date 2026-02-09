import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { UserOrmEntity } from "./user.orm-entity";
import { InstructorReviewOrmEntity } from "./instructor.review-orm.entity";

@Entity("instructor_profiles")
export class InstructorProfileOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ nullable: false })
  userId!: string;

  @OneToOne(() => UserOrmEntity, (u) => u.instructorProfile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;

  @Column({ nullable: true })
  headline?: string;

  @Column({ type: "text", nullable: true })
  bio?: string; // markdown allowed

  @Column({ type: "text", nullable: true })
  certificate?: string;

  @Column({ type: "text", nullable: true })
  experience?: string;

  @Column({ type: "text", nullable: true })
  education?: string;

  @Column({ type: "text", nullable: true })
  expertise?: string;

  // @Index({ using: 'gin' })
  @Column({ type: "simple-array", nullable: true })
  tags?: string[];

  @Column({ type: "float", default: 0 })
  rating!: number;

  @Column({ type: "int", default: 0 })
  totalStudents!: number;

  @CreateDateColumn({ type: "timestamp" })
  joinedAt!: Date;

  @Column({ type: "int", default: 0 })
  totalCourses!: number;

  @OneToMany(() => InstructorReviewOrmEntity, (r) => r.instructor)
  reviews?: InstructorReviewOrmEntity[];
}
