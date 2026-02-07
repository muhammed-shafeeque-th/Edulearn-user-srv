export enum RelationshipStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

export class InstructorStudent {
    private constructor(
        public readonly id: string,
        public readonly instructorId: string,
        public readonly studentId: string,
        public readonly status: RelationshipStatus,
        public readonly firstCourseId: string | null,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        instructorId: string;
        studentId: string;
        status?: RelationshipStatus;
        firstCourseId?: string | null;
        createdAt?: Date;
    }): InstructorStudent {
        return new InstructorStudent(
            props.id,
            props.instructorId,
            props.studentId,
            props.status ?? RelationshipStatus.ACTIVE,
            props.firstCourseId ?? null,
            props.createdAt ?? new Date(),
        );
    }

    deactivate(): InstructorStudent {
        return InstructorStudent.create({
            id: this.id,
            instructorId: this.instructorId,
            studentId: this.studentId,
            status: RelationshipStatus.INACTIVE,
            firstCourseId: this.firstCourseId,
            createdAt: this.createdAt,
        });
    }

    activate(): InstructorStudent {
        return InstructorStudent.create({
            id: this.id,
            instructorId: this.instructorId,
            studentId: this.studentId,
            status: RelationshipStatus.ACTIVE,
            firstCourseId: this.firstCourseId,
            createdAt: this.createdAt,
        });
    }
}
