import { UserWalletNotFoundException } from "src/domain/exceptions";
import { WalletTransaction } from "src/domain/entities/wallet-transaction.entiy";
import { IWalletRepository } from "@/domain/repositories/wallet.repository";
import { GetWalletTransactionsUseCase } from "@/application/use-cases/wallet/impls/get-wallet-transactions.use-case";
import { createMockLogger } from "test/mocks/logger.mock";
import { createMockTracer } from "test/mocks/tracer.mock";
import { createMockWalletRepository } from "test/mocks/wallet-repository.mock";
import { createMockWallet } from "test/fixtures/wallet.fixture";

describe("GetWalletTransactionsUseCase", () => {
  let useCase: GetWalletTransactionsUseCase;
  let walletRepo: jest.Mocked<IWalletRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let tracer: ReturnType<typeof createMockTracer>;

  beforeEach(() => {
    walletRepo = createMockWalletRepository();
    logger = createMockLogger();
    tracer = createMockTracer();

    useCase = new GetWalletTransactionsUseCase(
      walletRepo,
      logger as any,
      tracer as any,
    );
  });

  it("should return paginated transactions for user wallet", async () => {
    const mockWallet = createMockWallet();
    const mockTransactions = [
      WalletTransaction.create({
        walletId: mockWallet.id,
        amount: 50,
        type: "deposit",
        status: "complete",
        note: "Payment",
      }),
    ];

    walletRepo.findByUserId.mockResolvedValue({
      wallet: mockWallet,
      totalTransactions: 0,
    });
    walletRepo.findTransactionsByWalletId.mockResolvedValue({
      transactions: mockTransactions,
      totalTransactions: 1,
    });

    const result = await useCase.execute("user-123", 1, 10);

    expect(result).toBeDefined();
    expect(result.transactions).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(walletRepo.findByUserId).toHaveBeenCalledWith("user-123");
    expect(walletRepo.findTransactionsByWalletId).toHaveBeenCalledWith(
      mockWallet.id,
      0,
      10,
    );
  });

  it("should throw UserWalletNotFoundException if wallet not found", async () => {
    walletRepo.findByUserId.mockResolvedValue({
      wallet: null,
      totalTransactions: 0,
    });

    await expect(useCase.execute("user-123", 1, 10)).rejects.toThrow(
      UserWalletNotFoundException,
    );
  });

  it("should throw UserWalletNotFoundException if transactions are null", async () => {
    const mockWallet = createMockWallet();
    walletRepo.findByUserId.mockResolvedValue({
      wallet: mockWallet,
      totalTransactions: 0,
    });
    walletRepo.findTransactionsByWalletId.mockResolvedValue({
      transactions: null as any,
      totalTransactions: 0,
    });

    await expect(useCase.execute("user-123", 1, 10)).rejects.toThrow(
      UserWalletNotFoundException,
    );
  });

  it("should normalize negative page and limit to defaults", async () => {
    const mockWallet = createMockWallet();
    walletRepo.findByUserId.mockResolvedValue({
      wallet: mockWallet,
      totalTransactions: 0,
    });
    walletRepo.findTransactionsByWalletId.mockResolvedValue({
      transactions: [],
      totalTransactions: 0,
    });

    await useCase.execute("user-123", -1, 0);

    // Source normalizes: page=1, limit=10, offset=0
    expect(walletRepo.findTransactionsByWalletId).toHaveBeenCalledWith(
      mockWallet.id,
      0,
      10,
    );
  });
});
