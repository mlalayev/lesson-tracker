import mongoose, { Schema, models, model } from 'mongoose';

export interface ITemplateLesson {
  id: string;
  time: string;
  subject: string;
  studentName: string;
  notes?: string;
  duration: number;
  teacherId?: string;
}

export interface ISalary {
  year: number;
  month: number;
  salary: number;
}

export interface IUser {
  _id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  passwordHash: string;
  templates: {
    odd: ITemplateLesson[];
    even: ITemplateLesson[];
  };
  lessons: ITemplateLesson[]; // User's lessons
  salaries: ISalary[]; // Teacher salaries by month
  createdAt: Date;
  updatedAt: Date;
}

const TemplateLessonSchema = new Schema<ITemplateLesson>({
  id: { type: String, required: true },
  time: { type: String, required: true },
  subject: { type: String, required: true },
  studentName: { type: String, required: true },
  notes: { type: String },
  duration: { type: Number, required: true },
  teacherId: { type: String }
}, { _id: false });

const SalarySchema = new Schema<ISalary>({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  salary: { type: Number, required: true }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'], default: 'EMPLOYEE' },
  passwordHash: { type: String, required: true },
  templates: {
    odd: { type: [TemplateLessonSchema], default: [] },
    even: { type: [TemplateLessonSchema], default: [] }
  },
  lessons: { type: [TemplateLessonSchema], default: [] },
  salaries: { type: [SalarySchema], default: [] }
}, { timestamps: true });

export const User = models.User || model<IUser>('User', UserSchema);


