import { GetCartByUserUseCase } from "@/application/use-cases/cart/impls/get-cart-by-user.use-case";
import { ICartRepository } from "@/domain/repositories/cart.repository";
import { CartNotFoundException } from "src/domain/exceptions";
import { createMockCart, createMockCartItem } from "test/fixtures/cart.fixture";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockCartRepository } from "test/mocks/cart-repository.mock";
import { createMockTracer } from "test/mocks/tracer.mock";

describe("GetCartByUserUseCase", () => {
  let useCase: GetCartByUserUseCase;
  let cartRepo: jest.Mocked<ICartRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    cartRepo = createMockCartRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetCartByUserUseCase(cartRepo, logger as any, tracer as any);
  });

  it("should return the user cart DTO with items", async () => {
    const mockCart = createMockCart();
    const item = createMockCartItem(mockCart.id, "course-1");
    mockCart.addToCart(item);

    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 1 });

    // execute(userId, page, limit)
    const result = await useCase.execute("user-123", 1, 10);

    expect(result).toBeDefined();
    expect(result.cart).toBeDefined();
    expect(result.cart!.id).toBe(mockCart.id);
    expect(result.cart!.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("should throw CartNotFoundException if cart not found", async () => {
    cartRepo.findByUserId.mockResolvedValue({ cart: null, totalItems: 0 });

    await expect(useCase.execute("user-123", 1, 10)).rejects.toThrow(
      CartNotFoundException,
    );
  });
});
