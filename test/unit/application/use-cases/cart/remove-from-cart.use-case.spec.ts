import { RemoveFromCartUseCase } from "@/application/use-cases/cart/impls/remove-cart.use-case";
import { ICartRepository } from "@/domain/repositories/cart.repository";
import { CartItemNotFoundException, CartNotFoundException } from "src/domain/exceptions";
import { createMockCart, createMockCartItem } from "test/fixtures/cart.fixture";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockCartRepository } from "test/mocks/cart-repository.mock";
import { createMockTracer } from "test/mocks/tracer.mock";

describe("RemoveFromCartUseCase", () => {
  let useCase: RemoveFromCartUseCase;
  let cartRepo: jest.Mocked<ICartRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    cartRepo = createMockCartRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new RemoveFromCartUseCase(cartRepo, logger as any, tracer as any);
  });

  it("should remove an item from the cart", async () => {
    const mockCart = createMockCart();
    const mockItem = createMockCartItem(mockCart.id, "course-1");
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 1 });
    cartRepo.findItemByUserIdAndCourseId.mockResolvedValue(mockItem);
    cartRepo.removeItem.mockResolvedValue(undefined);

    await useCase.execute("user-123", "course-1");

    expect(cartRepo.removeItem).toHaveBeenCalledWith(mockCart.id, "course-1");
  });

  it("should throw CartItemNotFoundException if cart not found", async () => {
    cartRepo.findByUserId.mockResolvedValue({ cart: null, totalItems: 0 });

    await expect(useCase.execute("user-123", "course-1")).rejects.toThrow(
      CartNotFoundException,
    );
  });

  it("should throw CartItemNotFoundException if item not in cart", async () => {
    const mockCart = createMockCart();
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 0 });
    cartRepo.findItemByUserIdAndCourseId.mockResolvedValue(null);

    await expect(useCase.execute("user-123", "course-1")).rejects.toThrow(
      CartItemNotFoundException,
    );
  });
});
