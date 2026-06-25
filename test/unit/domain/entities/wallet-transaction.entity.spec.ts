import { WalletTransaction } from "src/domain/entities/wallet-transaction.entiy";

describe("WalletTransaction Entity", () => {
  describe("create()", () => {
    it("should create a transaction with generated id and timestamp", () => {
      const tx = WalletTransaction.create({
        walletId: "w-1",
        amount: 100,
        type: "deposit",
        status: "complete",
        note: "Test deposit",
        relatedOrder: "order-1",
      });

      expect(tx.id).toBeDefined();
      expect(tx.walletId).toBe("w-1");
      expect(tx.amount).toBe(100);
      expect(tx.type).toBe("deposit");
      expect(tx.status).toBe("complete");
      expect(tx.note).toBe("Test deposit");
      expect(tx.relatedOrder).toBe("order-1");
      expect(tx.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("fromPrimitives()", () => {
    it("should rehydrate from primitives", () => {
      const now = new Date();
      const tx = WalletTransaction.fromPrimitives({
        id: "tx-1",
        walletId: "w-1",
        amount: 50,
        type: "withdrawal",
        status: "pending",
        timestamp: now,
      });
      expect(tx.id).toBe("tx-1");
      expect(tx.amount).toBe(50);
      expect(tx.status).toBe("pending");
    });
  });

  describe("markComplete()", () => {
    it("should change status to complete", () => {
      const tx = WalletTransaction.create({
        walletId: "w-1",
        amount: 10,
        type: "deposit",
        status: "pending",
      });
      tx.markComplete();
      expect(tx.status).toBe("complete");
    });

    it("should be idempotent", () => {
      const tx = WalletTransaction.create({
        walletId: "w-1",
        amount: 10,
        type: "deposit",
        status: "complete",
      });
      tx.markComplete();
      expect(tx.status).toBe("complete");
    });
  });

  describe("markFailed()", () => {
    it("should change status to failed", () => {
      const tx = WalletTransaction.create({
        walletId: "w-1",
        amount: 10,
        type: "deposit",
        status: "pending",
      });
      tx.markFailed();
      expect(tx.status).toBe("failed");
    });

    it("should be idempotent", () => {
      const tx = WalletTransaction.create({
        walletId: "w-1",
        amount: 10,
        type: "deposit",
        status: "failed",
      });
      tx.markFailed();
      expect(tx.status).toBe("failed");
    });
  });

  describe("equals()", () => {
    it("should return true for identical transactions", () => {
      const now = new Date();
      const a = WalletTransaction.fromPrimitives({
        id: "tx-1",
        walletId: "w-1",
        amount: 100,
        type: "deposit",
        status: "complete",
        timestamp: now,
        note: "test",
      });
      const b = WalletTransaction.fromPrimitives({
        id: "tx-1",
        walletId: "w-1",
        amount: 100,
        type: "deposit",
        status: "complete",
        timestamp: now,
        note: "test",
      });
      expect(a.equals(b)).toBe(true);
    });

    it("should return false for differing transactions", () => {
      const now = new Date();
      const a = WalletTransaction.fromPrimitives({
        id: "tx-1",
        walletId: "w-1",
        amount: 100,
        type: "deposit",
        status: "complete",
        timestamp: now,
      });
      const b = WalletTransaction.fromPrimitives({
        id: "tx-2",
        walletId: "w-1",
        amount: 200,
        type: "withdrawal",
        status: "pending",
        timestamp: now,
      });
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("toPrimitives()", () => {
    it("should serialize to plain object", () => {
      const tx = WalletTransaction.create({
        walletId: "w-1",
        amount: 100,
        type: "deposit",
        status: "complete",
        note: "Test",
        relatedOrder: "order-1",
      });
      const p = tx.toPrimitives();

      expect(p.id).toBe(tx.id);
      expect(p.walletId).toBe("w-1");
      expect(p.amount).toBe(100);
      expect(p.type).toBe("deposit");
      expect(p.status).toBe("complete");
      expect(p.note).toBe("Test");
      expect(p.relatedOrder).toBe("order-1");
      expect(p.timestamp).toBeInstanceOf(Date);
    });
  });
});
