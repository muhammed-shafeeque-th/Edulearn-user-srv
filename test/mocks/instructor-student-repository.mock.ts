import { InstructorStudent } from "@/domain/entities/instructor-student.entity";
import { IInstructorStudentRepository } from "@/domain/repositories/instructor-student.repository";
import { Pagination } from "@/infrastructure/grpc/generated/course/common";

export class MockInstructorStudentRepository extends IInstructorStudentRepository {
  upsertRelation = jest.fn<
    Promise<InstructorStudent>,
    [{ instructorId: string; studentId: string; firstCourseId?: string | null }]
  >();
  findRelation = jest.fn<
    Promise<InstructorStudent | null>,
    [{ instructorId: string; studentId: string }]
  >();
  isStudentOfInstructor = jest.fn<
    Promise<boolean>,
    [{ instructorId: string; studentId: string }]
  >();
  getStudentsOfInstructor: jest.MockedFunction<any> = jest.fn<
    Promise<{ data: InstructorStudent[]; total: number }>,
    [{ instructorId: string; pagination: Pagination }]
  >();
  getInstructorsOfStudent: jest.MockedFunction<any> = jest.fn<
    Promise<{ data: InstructorStudent[]; total: number }>,
    [{ studentId: string; pagination: Pagination }]
  >();
  deactivateRelation = jest.fn<
    Promise<void>,
    [{ instructorId: string; studentId: string }]
  >();
}

export function createMockInstructorStudentRepository(): jest.Mocked<IInstructorStudentRepository> {
  return new MockInstructorStudentRepository();
}
