interface InstructorProps {
  id: string;
  userId: string;
  bio?: string;
  headline?: string;
  experience?: string;
  certificate?: string;
  expertise?: string;
  tags?: string[];
  rating?: number;
  totalRatings?: number;
  totalCourses?: number;
  totalStudents?: number;
}


export class InstructorProfile {
  constructor(private props: InstructorProps) {}

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get bio(): string {
    return this.props.bio;
  }
  get headline(): string {
    return this.props.headline;
  }
  get experience(): string {
    return this.props.experience;
  }
  get certificate(): string {
    return this.props.certificate;
  }
  get expertise(): string {
    return this.props.expertise;
  }
  get tags(): string[] {
    return this.props.tags;
  }
  get rating(): number {
    return this.props.rating;
  }
  get totalRatings(): number {
    return this.props.totalRatings;
  }
  get totalCourses(): number {
    return this.props.totalCourses;
  }
  get totalStudents(): number {
    return this.props.totalStudents;
  }
  

 
  public addRating(newRating: number): void {
    if (typeof newRating !== "number" || newRating < 1 || newRating > 5) {
      throw new Error("Rating must be a number between 1 and 5.");
    }
    const currentTotalRatings = this.props.totalRatings ?? 0;
    const currentRating = this.props.rating ?? 0;
    const newTotalRatings = currentTotalRatings + 1;
    // Calculate new average rating
    const newAverageRating =
      (currentRating * currentTotalRatings + newRating) / newTotalRatings;

    this.props = {
      ...this.props,
      rating: parseFloat(newAverageRating.toFixed(2)),
      totalRatings: newTotalRatings,
    };
  }


  public resetRatings(): void {
    this.props = {
      ...this.props,
      rating: 0,
      totalRatings: 0,
    };
  }

  public incrementTotalCourse(): void {
    this.props = {
      ...this.props,
      totalCourses: (this.props.totalCourses ?? 0) + 1,
    };
  }

  public incrementTotalStudents(count: number = 1): void {
    if (count < 1) return;
    this.props = {
      ...this.props,
      totalStudents: (this.props.totalStudents ?? 0) + count,
    };
  }

  public removeRating(removedRating: number): void {
    const currentTotalRatings = this.props.totalRatings ?? 0;
    const currentRating = this.props.rating ?? 0;
    if (currentTotalRatings <= 1) {
      // If only one rating existed, reset
      this.resetRatings();
      return;
    }
    const newTotalRatings = currentTotalRatings - 1;
    const newAverageRating =
      (currentRating * currentTotalRatings - removedRating) / newTotalRatings;

    this.props = {
      ...this.props,
      rating: parseFloat(newAverageRating.toFixed(2)),
      totalRatings: newTotalRatings,
    };
  }

  public update(data: {
    bio?: string;
    headline?: string;
    experience?: string;
    certificate?: string;
    expertise?: string;
    tags?: string[];
    preferences?: Record<string, string>;
  }): void {
    this.props = {
      ...this.props,
      ...data,
    };
  }

  toJson() {
    return { ...this.props };
  }
}
