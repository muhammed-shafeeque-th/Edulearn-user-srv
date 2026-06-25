import { Wallet } from "@/domain/entities/user-wallet.entity";
import { FAKE_USER_ID } from "./constants";

export function createMockWallet(userId = FAKE_USER_ID): Wallet {
  return Wallet.createInitial(userId, "INR");
}
