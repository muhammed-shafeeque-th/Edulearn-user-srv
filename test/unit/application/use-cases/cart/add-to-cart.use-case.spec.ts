import { AddToCartUseCase } from "@/application/use-cases/cart/impls/add-to-cart.use-case";
import { ICartRepository } from "@/domain/repositories/cart.repository";
import { BadRequestException } from "@/shared/exceptions/infra.exceptions";
import {
  CartItemAlreadyExistException,
  CartNotFoundException,
} from "src/domain/exceptions";
import { FAKE_COURSE_ID, FAKE_USER_ID } from "test/fixtures";
import { createMockCart, createMockCartItem } from "test/fixtures/cart.fixture";
import { createMockCourseClient } from "test/helpers/mock-factories";
import { createMockCartRepository } from "test/mocks/cart-repository.mock";
import { createMockEventPublisher } from "test/mocks/event-publisher.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";

describe("AddToCartUseCase", () => {
  let useCase: AddToCartUseCase;
  let cartRepo: jest.Mocked<ICartRepository>;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;
  let courseClient: ReturnType<typeof createMockCourseClient>;

  beforeEach(() => {
    cartRepo = createMockCartRepository();
    eventPublisher = createMockEventPublisher();
    logger = createMockLogger();
    tracer = createMockTracer();
    courseClient = createMockCourseClient();

    useCase = new AddToCartUseCase(
      cartRepo,
      logger,
      tracer,
      courseClient,
    );
  });

  it("should add an item to the cart", async () => {
    const mockCart = createMockCart();
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 0 });
    cartRepo.findItemByUserIdAndCourseId.mockResolvedValue(null);
    courseClient.getCourse.mockResolvedValue({course: {} as any});
    courseClient.checkCourseEnrollment.mockResolvedValue({ isEnrolled: false });
    cartRepo.addItem.mockResolvedValue(undefined);

    const result = await useCase.execute(FAKE_USER_ID, FAKE_COURSE_ID);

    expect(result).toBeDefined();
    expect(result.courseId).toBe(FAKE_COURSE_ID);
    expect(cartRepo.addItem).toHaveBeenCalledTimes(1);
    expect(courseClient.getCourse).toHaveBeenCalledTimes(1);
  });

  it("should throw BadRequestException if course not found after query course service", async () => {
    const mockCart = createMockCart();
    courseClient.getCourse.mockResolvedValue({});
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 0 });

    await expect(useCase.execute(FAKE_USER_ID, FAKE_COURSE_ID)).rejects.toThrow(
      BadRequestException,
    );
  });
  it("should throw CartNotFoundException if cart not found for user", async () => {
    cartRepo.findByUserId.mockResolvedValue({ cart: null, totalItems: 0 });
    courseClient.getCourse.mockResolvedValue({course: {} as any});

    await expect(useCase.execute(FAKE_USER_ID, FAKE_COURSE_ID)).rejects.toThrow(
      CartNotFoundException,
    );
  });

  it("should throw CartItemAlreadyExistException if item already in cart", async () => {
    const mockCart = createMockCart();
    const existingItem = createMockCartItem(mockCart.id, FAKE_COURSE_ID);
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 1 });
    cartRepo.findItemByUserIdAndCourseId.mockResolvedValue(existingItem);

    await expect(useCase.execute(FAKE_USER_ID, FAKE_COURSE_ID)).rejects.toThrow(
      CartItemAlreadyExistException,
    );
    expect(cartRepo.addItem).not.toHaveBeenCalled();
  });
});
