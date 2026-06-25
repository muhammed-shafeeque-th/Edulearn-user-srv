import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import {
  IInstructorStudentRepository,
  Pagination,
} from "src/domain/repositories/instructor-student.repository";
import { InstructorStudent } from "src/domain/entities/instructor-student.entity";
import {
  InstructorStudentOrmEntity,
  RelationshipStatusOrm,
} from "../entities/instructor-student.orm-entity";
import { EntityMapper } from "../mapper/entity-mapper";

export class TypeOrmInstructorStudentRepository
  implements IInstructorStudentRepository
{
  constructor(
    @InjectRepository(InstructorStudentOrmEntity)
    private readonly repo: Repository<InstructorStudentOrmEntity>,
  ) {}

  async upsertRelation(input: {
    instructorId: string;
    studentId: string;
    firstCourseId?: string | null;
  }): Promise<InstructorStudent> {
    const existing = await this.repo.findOne({
      where: {
        instructorId: input.instructorId,
        studentId: input.studentId,
      },
    });

    if (!existing) {
      const created = this.repo.create({
        instructorId: input.instructorId,
        studentId: input.studentId,
        firstCourseId: input.firstCourseId ?? null,
        status: RelationshipStatusOrm.ACTIVE,
      });

      const saved = await this.repo.save(created);
      return EntityMapper.toInstructorStudentDomain(saved);
    }

    existing.status = RelationshipStatusOrm.ACTIVE;

    if (!existing.firstCourseId && input.firstCourseId) {
      existing.firstCourseId = input.firstCourseId;
    }

    const saved = await this.repo.save(existing);
    return EntityMapper.toInstructorStudentDomain(saved);
  }

  async findRelation(input: {
    instructorId: string;
    studentId: string;
  }): Promise<InstructorStudent | null> {
    const rel = await this.repo.findOne({
      where: { instructorId: input.instructorId, studentId: input.studentId },
    });
    return rel ? EntityMapper.toInstructorStudentDomain(rel) : null;
  }

  async isStudentOfInstructor(input: {
    instructorId: string;
    studentId: string;
  }): Promise<boolean> {
    return this.repo.exist({
      where: {
        instructorId: input.instructorId,
        studentId: input.studentId,
        status: RelationshipStatusOrm.ACTIVE,
      },
    });
  }

  async getStudentsOfInstructor(input: {
    instructorId: string;
    pagination: Pagination;
  }): Promise<{ data: InstructorStudent[]; total: number }> {
    const { offset, limit } = input.pagination;

    const [rows, total] = await this.repo.findAndCount({
      where: {
        instructorId: input.instructorId,
        status: RelationshipStatusOrm.ACTIVE,
      },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });

    return {
      data: rows.map(EntityMapper.toInstructorStudentDomain),
      total,
    };
  }

  async getInstructorsOfStudent(input: {
    studentId: string;
    pagination: Pagination;
  }): Promise<{ data: InstructorStudent[]; total: number }> {
    const { offset, limit } = input.pagination;

    const [rows, total] = await this.repo.findAndCount({
      where: {
        studentId: input.studentId,
        status: RelationshipStatusOrm.ACTIVE,
      },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });

    return {
      data: rows.map(EntityMapper.toInstructorStudentDomain),
      total,
    };
  }

  async deactivateRelation(input: {
    instructorId: string;
    studentId: string;
  }): Promise<void> {
    await this.repo.update(
      {
        instructorId: input.instructorId,
        studentId: input.studentId,
      },
      {
        status: RelationshipStatusOrm.INACTIVE,
      },
    );
  }
}
