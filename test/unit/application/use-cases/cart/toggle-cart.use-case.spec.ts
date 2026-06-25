import { ToggleCartUseCase } from "@/application/use-cases/cart/impls/toggle-cart.use-case";
import { ICartRepository } from "@/domain/repositories/cart.repository";
import { CartNotFoundException } from "src/domain/exceptions";
import { createMockCart, createMockCartItem } from "test/fixtures/cart.fixture";
import { createMockCartRepository } from "test/mocks/cart-repository.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";

describe("ToggleCartUseCase", () => {
  let useCase: ToggleCartUseCase;
  let cartRepo: jest.Mocked<ICartRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    cartRepo = createMockCartRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    // Constructor: cartRepository, kafkaProducer, logger, tracer
    useCase = new ToggleCartUseCase(cartRepo, logger as any, tracer as any);
  });

  it("should add item to cart when it does not exist", async () => {
    const mockCart = createMockCart();
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 0 });
    cartRepo.findItemByUserIdAndCourseId.mockResolvedValue(null);
    cartRepo.addItem.mockResolvedValue(undefined);

    const result = await useCase.execute("user-123", "course-1");

    expect(result).toBeDefined();
    expect(result.courseId).toBe("course-1");
    expect(cartRepo.addItem).toHaveBeenCalledTimes(1);
    expect(cartRepo.removeItem).not.toHaveBeenCalled();
  });

  it("should remove item from cart when it already exists", async () => {
    const mockCart = createMockCart();
    const existingItem = createMockCartItem(mockCart.id, "course-1");
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 1 });
    cartRepo.findItemByUserIdAndCourseId.mockResolvedValue(existingItem);
    cartRepo.removeItem.mockResolvedValue(undefined);

    const result = await useCase.execute("user-123", "course-1");

    expect(result).toBeDefined();
    expect(cartRepo.removeItem).toHaveBeenCalledWith(mockCart.id, "course-1");
    expect(cartRepo.addItem).not.toHaveBeenCalled();
  });

  it("should throw CartNotFoundException if cart not found for user", async () => {
    cartRepo.findByUserId.mockResolvedValue({ cart: null, totalItems: 0 });

    await expect(useCase.execute("user-123", "course-1")).rejects.toThrow(
      CartNotFoundException,
    );
  });
});
