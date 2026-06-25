import { ClearCartUseCase } from "@/application/use-cases/cart/impls/clear-cart.use-case";
import { ICartRepository } from "@/domain/repositories/cart.repository";
import { CartNotFoundException } from "src/domain/exceptions";
import { createMockCart } from "test/fixtures/cart.fixture";
import { createMockCartRepository } from "test/mocks/cart-repository.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";

describe("ClearCartUseCase", () => {
  let useCase: ClearCartUseCase;
  let cartRepo: jest.Mocked<ICartRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    cartRepo = createMockCartRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new ClearCartUseCase(cartRepo, logger as any, tracer as any);
  });

  it("should clear cart for user when cart exists", async () => {
    const mockCart = createMockCart("user-123");
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 5 });
    cartRepo.clearCart.mockResolvedValue(undefined);

    await useCase.execute("user-123");

    expect(cartRepo.findByUserId).toHaveBeenCalledWith("user-123");
    expect(cartRepo.clearCart).toHaveBeenCalledWith("user-123");
  });

  it("should throw CartNotFoundException when cart not found", async () => {
    cartRepo.findByUserId.mockResolvedValue({ cart: null, totalItems: 0 });

    await expect(useCase.execute("user-123")).rejects.toThrow(
      CartNotFoundException,
    );
    expect(cartRepo.clearCart).not.toHaveBeenCalled();
  });

  it("should log cart clearing operation", async () => {
    const mockCart = createMockCart("user-123");
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 5 });
    cartRepo.clearCart.mockResolvedValue(undefined);

    await useCase.execute("user-123");

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining("Clearing cart"),
      expect.any(Object),
    );
  });

  it("should log warning when cart not found", async () => {
    cartRepo.findByUserId.mockResolvedValue({ cart: null, totalItems: 0 });

    try {
      await useCase.execute("user-123");
    } catch {
      // Expected
    }

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Cart not found"),
      expect.any(Object),
    );
  });

  it("should use tracer for span creation", async () => {
    const mockCart = createMockCart("user-123");
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 5 });
    cartRepo.clearCart.mockResolvedValue(undefined);

    await useCase.execute("user-123");

    expect(tracer.startActiveSpan).toHaveBeenCalledWith(
      "ClearCartUseCase.execute",
      expect.any(Function),
    );
  });

  it("should set span attributes with user ID", async () => {
    const mockCart = createMockCart("user-456");
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 3 });
    cartRepo.clearCart.mockResolvedValue(undefined);

    await useCase.execute("user-456");

    expect(tracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should handle repository errors on findByUserId", async () => {
    cartRepo.findByUserId.mockRejectedValue(new Error("Database error"));

    await expect(useCase.execute("user-123")).rejects.toThrow("Database error");
  });

  it("should handle repository errors on clearCart", async () => {
    const mockCart = createMockCart("user-123");
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 5 });
    cartRepo.clearCart.mockRejectedValue(new Error("Clear failed"));

    await expect(useCase.execute("user-123")).rejects.toThrow("Clear failed");
  });

  it("should clear cart with many items", async () => {
    const mockCart = createMockCart("user-789");
    cartRepo.findByUserId.mockResolvedValue({
      cart: mockCart,
      totalItems: 100,
    });
    cartRepo.clearCart.mockResolvedValue(undefined);

    await useCase.execute("user-789");

    expect(cartRepo.clearCart).toHaveBeenCalledWith("user-789");
  });

  it("should clear empty cart", async () => {
    const mockCart = createMockCart("user-123");
    cartRepo.findByUserId.mockResolvedValue({ cart: mockCart, totalItems: 0 });
    cartRepo.clearCart.mockResolvedValue(undefined);

    await useCase.execute("user-123");

    expect(cartRepo.clearCart).toHaveBeenCalledWith("user-123");
  });
});
