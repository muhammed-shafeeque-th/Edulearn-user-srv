export abstract class IRemoveFromWishlistUseCase {
  abstract execute(userId: string, courseId: string): Promise<void>;
}
