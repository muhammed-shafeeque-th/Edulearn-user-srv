import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { UserOrmEntity } from "./user.orm-entity";

export enum RelationshipStatusOrm {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

@Entity("instructor_students")
@Index(["instructorId", "studentId"], { unique: true })
@Index(["instructorId"])
@Index(["studentId"])
export class InstructorStudentOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  instructorId!: string;

  @Column("uuid")
  studentId!: string;

  @Column("uuid", { nullable: true })
  firstCourseId?: string | null;

  @Column({
    type: "enum",
    enum: RelationshipStatusOrm,
    default: RelationshipStatusOrm.ACTIVE,
  })
  status!: RelationshipStatusOrm;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  // relations
  @ManyToOne(() => UserOrmEntity, (u) => u.students, { onDelete: "CASCADE" })
  @JoinColumn({ name: "instructorId" })
  instructor!: UserOrmEntity;

  @ManyToOne(() => UserOrmEntity, (u) => u.instructors, { onDelete: "CASCADE" })
  @JoinColumn({ name: "studentId" })
  student!: UserOrmEntity;
}
