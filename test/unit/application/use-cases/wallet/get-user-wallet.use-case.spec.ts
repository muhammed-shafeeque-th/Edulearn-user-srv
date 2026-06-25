import { IWalletRepository } from "@/domain/repositories/wallet.repository";
import { GetUserWalletUseCase } from "@/application/use-cases/wallet/impls/get-user-wallet.use-case";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockWalletRepository } from "test/mocks/wallet-repository.mock";
import { createMockWallet } from "test/fixtures/wallet.fixture";
import { FAKE_USER_ID } from "test/fixtures";
import { UserWalletNotFoundException } from "@/domain/exceptions";

describe("GetUserWalletUseCase", () => {
  let useCase: GetUserWalletUseCase;
  let walletRepo: jest.Mocked<IWalletRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    walletRepo = createMockWalletRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetUserWalletUseCase(walletRepo, logger, tracer);
  });

  it("should return the wallet DTO when wallet exists", async () => {
    const mockWallet = createMockWallet();
    mockWallet.deposit(100);
    walletRepo.findByUserId.mockResolvedValue({
      wallet: mockWallet,
      totalTransactions: 1,
    });

    const result = await useCase.execute(FAKE_USER_ID);

    expect(result).toBeDefined();
    expect(result.wallet).toBeDefined();
    expect(result.wallet.userId).toBe(FAKE_USER_ID);
    expect(result.wallet.balance).toBe(100);
    expect(result.total).toBe(1);
    expect(walletRepo.findByUserId).toHaveBeenCalledWith(FAKE_USER_ID, 0, 10);
  });

  it("should throw UserWalletNotFoundException if wallet not found", async () => {
    walletRepo.findByUserId.mockResolvedValue({
      wallet: null,
      totalTransactions: 0,
    });

    await expect(useCase.execute(FAKE_USER_ID)).rejects.toThrow(
      UserWalletNotFoundException,
    );
  });
});
