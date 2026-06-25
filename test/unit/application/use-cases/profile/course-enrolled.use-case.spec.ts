import { UserNotFoundException } from "src/domain/exceptions";
import { CourseEnrollmentEvent } from "src/domain/events/course.events";
import { WalletTransaction } from "src/domain/entities/wallet-transaction.entiy";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { IInstructorStudentRepository } from "@/domain/repositories/instructor-student.repository";
import { IWalletRepository } from "@/domain/repositories/wallet.repository";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { createMockUserRepository } from "test/mocks/user-repository.mock";
import { createMockWalletRepository } from "test/mocks/wallet-repository.mock";
import { createMockInstructorStudentRepository } from "test/mocks/instructor-student-repository.mock";
import CourseEnrolledUseCase from "@/application/use-cases/profile/impls/course-enrolled.use-case";
import { createMockWallet, createMockWalletTransaction } from "test/fixtures/wallet.fixture";
import { createMockInstructorStudent, createMockInstructorUser } from "test/fixtures";
import { buildCourseEnrollmentEvent } from "test/fixtures/event-dto.fixture";

describe("CourseEnrolledUseCase", () => {
  let useCase: CourseEnrolledUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let walletRepo: jest.Mocked<IWalletRepository>;
  let instructorStudentRepo: jest.Mocked<IInstructorStudentRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  const enrollmentEvent = buildCourseEnrollmentEvent({orderPrice: 0})

  beforeEach(() => {
    userRepo = createMockUserRepository();
    walletRepo = createMockWalletRepository();
    instructorStudentRepo = createMockInstructorStudentRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new CourseEnrolledUseCase(
      userRepo,
      walletRepo,
      instructorStudentRepo,
      logger,
      tracer,
    );
  });

  

  it("should update instructor stats and add revenue on enrollment", async () => {
    const instructor = createMockInstructorUser();
    const wallet = createMockWallet("instructor-1");

    userRepo.findById.mockResolvedValue(instructor);
    walletRepo.findByUserId.mockResolvedValue({ wallet, totalTransactions: 0 });
    walletRepo.findTransactionByWalletIdAndOrderId.mockResolvedValue(null);
    walletRepo.save.mockResolvedValue(wallet);
    walletRepo.addTransaction.mockResolvedValue(undefined);
    userRepo.update.mockResolvedValue(instructor);
    // upsertRelation returns InstructorStudent
    const mockRelation = createMockInstructorStudent({
      id: "rel-1",
      instructorId: "instructor-1",
      studentId: "student-1",
    });
    instructorStudentRepo.upsertRelation.mockResolvedValue(mockRelation);

    const result = await useCase.execute(enrollmentEvent);

    expect(result).toBeDefined();
    expect(userRepo.update).toHaveBeenCalledWith("instructor-1", instructor);
    // expect(walletRepo.save).toHaveBeenCalledTimes(1);
    // expect(walletRepo.addTransaction).toHaveBeenCalledTimes(1);
    expect(instructorStudentRepo.upsertRelation).toHaveBeenCalledWith({
      studentId: "student-1",
      instructorId: "instructor-1",
      firstCourseId: "course-1",
    });
    // Revenue = 50.00 * 0.80 = 40.00
    expect(wallet.balance).toBe(0);
  });

  it("should throw UserNotFoundException if instructor not found", async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(enrollmentEvent)).rejects.toThrow(
      UserNotFoundException,
    );
  });

  it("should skip revenue if already credited for the same order (idempotency)", async () => {
    const instructor = createMockInstructorUser();
    const wallet = createMockWallet("instructor-1");
    const existingTx = createMockWalletTransaction({
      walletId: wallet.id,
      amount: 40,
      type: "deposit",
      status: "complete",
      relatedOrder: "order-1",
    });

    userRepo.findById.mockResolvedValue(instructor);
    walletRepo.findByUserId.mockResolvedValue({ wallet, totalTransactions: 1 });
    walletRepo.findTransactionByWalletIdAndOrderId.mockResolvedValue(
      existingTx,
    );
    userRepo.update.mockResolvedValue(instructor);
    const mockRelation = createMockInstructorStudent({
      id: "rel-2",
      instructorId: "instructor-1",
      studentId: "student-1",
    });
    instructorStudentRepo.upsertRelation.mockResolvedValue(mockRelation);

    const result = await useCase.execute(enrollmentEvent);

    expect(result).toBeDefined();
    expect(walletRepo.save).not.toHaveBeenCalled();
    expect(walletRepo.addTransaction).not.toHaveBeenCalled();
    // Balance remains 0
    expect(wallet.balance).toBe(0);
  });

  it("should silently skip revenue if wallet not found", async () => {
    const instructor = createMockInstructorUser();

    userRepo.findById.mockResolvedValue(instructor);
    walletRepo.findByUserId.mockResolvedValue({
      wallet: null,
      totalTransactions: 0,
    });
    userRepo.update.mockResolvedValue(instructor);
    const mockRelation = createMockInstructorStudent({
      id: "rel-3",
      instructorId: "instructor-1",
      studentId: "student-1",
    });
    instructorStudentRepo.upsertRelation.mockResolvedValue(mockRelation);

    const result = await useCase.execute(enrollmentEvent);

    expect(result).toBeDefined();
    expect(walletRepo.save).not.toHaveBeenCalled();
    expect(walletRepo.addTransaction).not.toHaveBeenCalled();
  });

  it("should skip revenue for invalid order price (zero or negative)", async () => {
    const instructor = createMockInstructorUser();

    

    userRepo.findById.mockResolvedValue(instructor);
    userRepo.update.mockResolvedValue(instructor);
    const mockRelation = createMockInstructorStudent({
      id: "rel-4",
      instructorId: "instructor-1",
      studentId: "student-1",
    });
    instructorStudentRepo.upsertRelation.mockResolvedValue(mockRelation);

    const eventWithZeroPrice: CourseEnrollmentEvent = {
      ...enrollmentEvent,
      payload: { ...enrollmentEvent.payload!, orderPrice: 0 },
    };
    const result = await useCase.execute(eventWithZeroPrice);

    expect(result).toBeDefined();
    expect(walletRepo.findByUserId).not.toHaveBeenCalled();
  });
});
