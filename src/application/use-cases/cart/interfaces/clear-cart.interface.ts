export abstract class IClearCartUseCase {
  abstract execute(userId: string): Promise<void>;
}
