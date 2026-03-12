import { InstructorStudent, RelationshipStatus } from "../entities/instructor-student.entity";

export type Pagination = {
    offset: number;
    limit: number;
};

export type InstructorStudentQuery = {
    instructorId?: string;
    studentId?: string;
    status?: RelationshipStatus;
};

export abstract class IInstructorStudentRepository {
    abstract upsertRelation(input: {
        instructorId: string;
        studentId: string;
        firstCourseId?: string | null;
    }): Promise<InstructorStudent>;

    abstract findRelation(input: {
        instructorId: string;
        studentId: string;
    }): Promise<InstructorStudent | null>;

    abstract isStudentOfInstructor(input: {
        instructorId: string;
        studentId: string;
    }): Promise<boolean>;

    abstract getStudentsOfInstructor(input: {
        instructorId: string;
        pagination: Pagination;
    }): Promise<{ data: InstructorStudent[]; total: number }>;

    abstract getInstructorsOfStudent(input: {
        studentId: string;
        pagination: Pagination;
    }): Promise<{ data: InstructorStudent[]; total: number }>;

    abstract deactivateRelation(input: {
        instructorId: string;
        studentId: string;
    }): Promise<void>;
}
