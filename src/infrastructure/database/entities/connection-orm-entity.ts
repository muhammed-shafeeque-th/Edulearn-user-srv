import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
} from "typeorm";
import { UserOrmEntity } from "./user.orm-entity";

@Entity("user_connections")
export class UserConnectionOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  followerId!: string;

  @Column("uuid")
  followedId!: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "followerId" })
  follower!: UserOrmEntity;

  @ManyToOne(() => UserOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "followedId" })
  followed!: UserOrmEntity;

  @Column({
    type: "enum",
    enum: ["pending", "accepted", "blocked"],
    default: "accepted",
  })
  status!: "pending" | "accepted" | "blocked";

  @CreateDateColumn()
  createdAt!: Date;
}
