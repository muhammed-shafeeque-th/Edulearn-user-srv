import CreateUserUseCase from "@/application/use-cases/profile/impls/create-user.use-case";
import { ICartRepository } from "@/domain/repositories/cart.repository";
import { IUserRepository } from "@/domain/repositories/user.repository";
import { IWalletRepository } from "@/domain/repositories/wallet.repository";
import { IWishlistRepository } from "@/domain/repositories/wishlist.repository";
import { UserRoles, UserStatus } from "src/domain/entities/user-entity";
import { UserAlreadyExistException } from "src/domain/exceptions";
import { createMockUser } from "test/fixtures";
import { createMockCartRepository } from "test/mocks/cart-repository.mock";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockUserRepository } from "test/mocks/user-repository.mock";
import { createMockWalletRepository } from "test/mocks/wallet-repository.mock";
import { createMockWishlistRepository } from "test/mocks/wishlist-repository.mock";

describe("CreateUserUseCase", () => {
  let useCase: CreateUserUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let cartRepo: jest.Mocked<ICartRepository>;
  let wishlistRepo: jest.Mocked<IWishlistRepository>;
  let walletRepo: jest.Mocked<IWalletRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    cartRepo = createMockCartRepository();
    wishlistRepo = createMockWishlistRepository();
    walletRepo = createMockWalletRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new CreateUserUseCase(
      userRepo,
      cartRepo,
      wishlistRepo,
      walletRepo,
      logger,
      tracer,
    );
  });

  const createDto = {
    eventId: "evt-1",
    eventType: "UserCreatedEvent",
    timestamp: Date.now(),
    payload: {
      userId: "user-new",
      email: "new@example.com",
      roles: [UserRoles.STUDENT],
      firstName: "New",
      lastName: "User",
      avatar: "avatar.png",
      createdAt: new Date(),
    },
  };

  it("should create a user and its initial assets (cart, wishlist, wallet)", async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.save.mockImplementation(async (user) => user);
    cartRepo.create.mockResolvedValue(undefined);
    wishlistRepo.create.mockResolvedValue(undefined);
    walletRepo.save.mockImplementation(async (w) => w);

    const result = await useCase.execute(createDto);

    expect(result).toBeDefined();
    expect(result.id).toBe("user-new");
    expect(result.email).toBe("new@example.com");
    expect(result.firstName).toBe("New");
    expect(result.roles).toEqual([UserRoles.STUDENT]);

    expect(userRepo.findByEmail).toHaveBeenCalledWith("new@example.com");
    expect(userRepo.save).toHaveBeenCalledTimes(1);
    expect(cartRepo.create).toHaveBeenCalledTimes(1);
    expect(wishlistRepo.create).toHaveBeenCalledTimes(1);
    expect(walletRepo.save).toHaveBeenCalledTimes(1);
  });

  it("should throw UserAlreadyExistException if email already exists", async () => {
    userRepo.findByEmail.mockResolvedValue(createMockUser());

    await expect(useCase.execute(createDto)).rejects.toThrow(
      UserAlreadyExistException,
    );
    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it("should propagate errors from asset creation", async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.save.mockImplementation(async (user) => user);
    cartRepo.create.mockRejectedValue(new Error("Cart creation failed"));

    await expect(useCase.execute(createDto)).rejects.toThrow(
      "Cart creation failed",
    );
  });
});
