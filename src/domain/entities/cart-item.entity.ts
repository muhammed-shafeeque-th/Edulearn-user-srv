
export class CartItem {
  constructor(
    private readonly id: string,
    private readonly courseId: string,
    private readonly cartId: string,
    private readonly addedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string {
    return this.id;
  }
  
  getCourseId(): string {
    return this.courseId;
  }
  
  getCartId(): string {
    return this.cartId;
  }
  
  getAddedAt(): Date {
    return this.addedAt;
  }
}
