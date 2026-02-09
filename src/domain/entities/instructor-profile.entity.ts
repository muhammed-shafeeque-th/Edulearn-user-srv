import { v4 as uuidV4 } from "uuid";



export interface InstructorProfileProps {
  id: string;
  userId: string;
  bio?: string;
  headline?: string;
  experience?: string;
  education?: string;
  certificate?: string;
  expertise?: string;
  joinedAt: Date;
  tags?: ReadonlyArray<string>;
  rating?: number;
  totalRatings?: number;
  totalCourses?: number;
  totalStudents?: number;
  preferences?: Record<string, string>;
}

type UpdatableFields = Partial<
  Pick<
    InstructorProfileProps,
    | "bio"
    | "headline"
    | "experience"
    | "education"
    | "certificate"
    | "expertise"
    | "tags"
    | "preferences"
  >
>;

export class InstructorProfile {
  private readonly _id: string;
  private readonly _userId: string;
  private _bio?: string;
  private _headline?: string;
  private _experience?: string;
  private _certificate?: string;
  private _expertise?: string;
  private _education?: string;
  private readonly _joinedAt: Date;
  private _tags: ReadonlyArray<string>;
  private _rating: number;
  private _totalRatings: number;
  private _totalCourses: number;
  private _totalStudents: number;
  private _preferences: Record<string, string>;

  private constructor(props: InstructorProfileProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._bio = props.bio;
    this._headline = props.headline;
    this._experience = props.experience;
    this._certificate = props.certificate;
    this._education = props.education;
    this._expertise = props.expertise;
    this._joinedAt = new Date(props.joinedAt);
    this._tags = props.tags ? [...props.tags] : [];
    this._rating = props.rating ? Number(props.rating) : 0;
    this._totalRatings = props.totalRatings ? Number(props.totalRatings) : 0;
    this._totalCourses = props.totalCourses ? Number(props.totalCourses) : 0;
    this._totalStudents = props.totalStudents ? Number(props.totalStudents) : 0;
    this._preferences = props.preferences ? { ...props.preferences } : {};
  }

  static create(
    props: Omit<InstructorProfileProps, "id" | "joinedAt">
  ): InstructorProfile {
    return new InstructorProfile({
      ...props,
      id: uuidV4(),
      joinedAt: new Date(),
    });
  }

  static fromPrimitives(props: InstructorProfileProps): InstructorProfile {
    return new InstructorProfile(props);
  }


  get id(): string {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }
  get bio(): string | undefined {
    return this._bio;
  }
  get headline(): string | undefined {
    return this._headline;
  }
  get experience(): string | undefined {
    return this._experience;
  }
  get certificate(): string | undefined {
    return this._certificate;
  }
  get expertise(): string | undefined {
    return this._expertise;
  }
  get education(): string | undefined {
    return this._education;
  }
  get joinedAt(): Date {
    return new Date(this._joinedAt);
  }
  get tags(): ReadonlyArray<string> {
    return [...this._tags];
  }
  get rating(): number {
    return this._rating;
  }
  get totalRatings(): number {
    return this._totalRatings;
  }
  get totalCourses(): number {
    return this._totalCourses;
  }
  get totalStudents(): number {
    return this._totalStudents;
  }
  get preferences(): Readonly<Record<string, string>> {
    return { ...this._preferences };
  }


  addRating(newRating: number): void {
    if (typeof newRating !== "number" || newRating < 1 || newRating > 5) {
      throw new Error("Rating must be a number between 1 and 5.");
    }
    const newTotalRatings = this._totalRatings + 1;
    const newAverage =
      (this._rating * this._totalRatings + newRating) / newTotalRatings;
    this._rating = parseFloat(newAverage.toFixed(2));
    this._totalRatings = newTotalRatings;
  }

  
  removeRating(removedRating: number): void {
    if (this._totalRatings <= 1) {
      this.resetRatings();
      return;
    }
    const newTotalRatings = this._totalRatings - 1;
    const aggregate = this._rating * this._totalRatings - removedRating;
    this._rating = parseFloat((aggregate / newTotalRatings).toFixed(2));
    this._totalRatings = newTotalRatings;
  }

 
  resetRatings(): void {
    this._rating = 0;
    this._totalRatings = 0;
  }

  /**
   * Increment instructor's total courses by one (used when new course published).
   */
  incrementTotalCourse(): void {
    this._totalCourses += 1;
  }

  /**
   * Increment the number of students taught (used on enrollment, etc.).
   */
  incrementTotalStudents(count: number = 1): void {
    if (count < 1) return;
    this._totalStudents += count;
  }

  
  update(data: UpdatableFields): void {
    if (data.bio !== undefined) this._bio = data.bio;
    if (data.headline !== undefined) this._headline = data.headline;
    if (data.experience !== undefined) this._experience = data.experience;
    if (data.certificate !== undefined) this._certificate = data.certificate;
    if (data.expertise !== undefined) this._expertise = data.expertise;
    if (data.tags !== undefined) this._tags = [...data.tags];
    if (data.preferences !== undefined)
      this._preferences = { ...data.preferences };
  }

  
  toJSON(): InstructorProfileProps {
    return {
      id: this._id,
      userId: this._userId,
      bio: this._bio,
      headline: this._headline,
      experience: this._experience,
      education: this._education,
      certificate: this._certificate,
      expertise: this._expertise,
      joinedAt: new Date(this._joinedAt),
      tags: [...this._tags],
      rating: this._rating,
      totalRatings: this._totalRatings,
      totalCourses: this._totalCourses,
      totalStudents: this._totalStudents,
      preferences: { ...this._preferences },
    };
  }
}
