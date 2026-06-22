export abstract class IRemoveFromCartUseCase {
  abstract execute(userId: string, courseId: string): Promise<void>;
}
