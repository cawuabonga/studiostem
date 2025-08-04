

import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'SuperAdmin' | 'Student' | 'Teacher' | 'Coordinator' | 'Admin';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  documentId?: string;
  instituteId: string | null;
}

// Represents a pre-created profile for a staff member, identified by Document ID.
// This is created by an admin and can be "claimed" by a user.
export interface StaffProfile {
  documentId: string;
  displayName: string;
  email: string;
  phone?: string;
  role: UserRole;
  condition: 'NOMBRADO' | 'CONTRATADO';
  programId: string;
  // This will be null until a user account is linked
  linkedUserUid?: string | null;
}

export interface StudentProfile {
  id?: string; // Firestore document ID
  documentId: string;
  firstName: string;
  lastName:string;
  fullName: string;
  gender: 'Masculino' | 'Femenino';
  age: number;
  email: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  programId: string;
  admissionYear: string;
  admissionPeriod: UnitPeriod;
  condition?: 'NOMBRADO' | 'CONTRATADO'; // Not typically used for students but for consistency
  role?: UserRole; // Will always be 'Student' implicitly
  linkedUserUid?: string | null;
}


export interface LoginDesign {
  imageUrl: string;
  backgroundColor: string;
  textColor: string;
  layout: 'side' | 'center';
}

export interface LoginImage {
  id: string;
  name: string;
  url: string;
  createdAt: Timestamp;
}


export interface Institute {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string; // HSL format e.g., "225 65% 32%"
}

export interface ProgramModule {
  name: string;
  code: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  abbreviation: string;
  duration: string;
  moduleCount: number;
  modules: ProgramModule[];
}

export type UnitPeriod = 'MAR-JUL' | 'AGO-DIC';
export type UnitType = 'Empleabilidad' | 'Especifica';
export type UnitTurno = 'Mañana' | 'Tarde' | 'Noche';

export interface Unit {
  id: string;
  name: string;
  code: string;
  credits: number;
  theoreticalHours: number;
  practicalHours: number;
  totalHours: number;
  totalWeeks: number;
  period: UnitPeriod;
  unitType: UnitType;
  turno: UnitTurno;
  programId: string;
  moduleId: string; // The code of the module, e.g., "MODULO 1 - ET"
  semester: number;
}

// This type is now based on StaffProfile for consistency.
// The `id` is derived from `documentId` for list keys.
export interface Teacher {
  id: string; // Document ID
  documentId: string;
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  active: boolean; // Could be derived from linked status or a specific field
  programName?: string;
  condition: 'NOMBRADO' | 'CONTRATADO';
}

export interface Assignment {
  [unitId: string]: string; // unitId -> teacherId (Document ID)
}

// --- PAYMENTS ---
export type PaymentStatus = 'Pendiente' | 'Aprobado' | 'Rechazado';

export interface PaymentConcept {
  id: string;
  code: string;
  name: string;
  amount: number;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  concept: string; // This will now be the name from PaymentConcept
  amount: number;
  paymentDate: Timestamp;
  operationNumber: string;
  voucherUrl: string;
  status: PaymentStatus;
  createdAt: Timestamp;
  processedAt?: Timestamp;
  receiptNumber?: string; // Assigned by admin on approval
  rejectionReason?: string; // Assigned by admin on rejection
}


// --- ACADEMIC & MATRICULATION TYPES ---

export interface Matriculation {
    id?: string; // Firestore document ID
    studentId: string; // The student's document ID
    unitId: string;
    programId: string;
    year: string;
    period: UnitPeriod;
    semester: number;
    moduleId: string;
    status: 'cursando' | 'aprobado' | 'desaprobado' | 'retirado';
    createdAt: Timestamp;
}

export interface EnrolledUnit extends Unit {
    programName: string;
    teacherName?: string; // To be added later
}


export interface AchievementIndicator {
  id: string;
  name: string;
  description: string;
  startWeek: number;
  endWeek: number;
}

export type ContentType = 'file' | 'link' | 'text';

export interface Content {
  id: string;
  title: string;
  type: ContentType;
  value: string; // URL for file/link, or markdown text
  order: number;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  fileUrl?: string; // URL to an attached file from the teacher
  order: number;
  createdAt: Timestamp;
  weekNumber: number; // The week this task belongs to
}

export interface Submission {
  id: string;
  studentUid: string;
  studentName: string;
  taskId: string;
  fileUrl: string; // URL to the student's submitted file
  submittedAt: Timestamp;
  grade?: number;
  feedback?: string;
}

// Represents a single grade entry for an evaluation
export interface GradeEntry {
  type: 'task' | 'manual';
  refId: string; // The ID of the original task, or a generated ID for a manual entry
  label: string; // Title of the task or manual evaluation
  grade: number | null;
  weekNumber: number;
}

// Represents a manually added evaluation column by the teacher for an indicator
export interface ManualEvaluation {
    id: string;
    indicatorId: string;
    label: string;
    weekNumber: number;
    createdAt: Timestamp;
}


// Represents the academic record of a student in a specific unit for a specific period.
export interface AcademicRecord {
  id: string; // Composite key, e.g., `${unitId}_${studentId}_${year}_${period}`
  studentId: string;
  unitId: string;
  programId: string;
  year: string;
  period: UnitPeriod;
  // A map where each key is an indicator ID, and the value is an array of grade entries
  grades: { [indicatorId: string]: GradeEntry[] };
  // A map of evaluations manually added by the teacher
  evaluations: { [indicatorId: string]: ManualEvaluation[] };
  finalGrade: number | null;
  attendancePercentage: number;
  status: 'cursando' | 'aprobado' | 'desaprobado' | 'inhabilitado' | 'retirado';
}

// --- ATTENDANCE TYPES ---
export type AttendanceStatus = 'P' | 'T' | 'F' | 'J' | 'U'; // Presente, Tarde, Falta, Justificada, Unmarked

export interface AttendanceRecord {
    id: string; // Composite key, e.g., `${unitId}_${year}_${period}`
    unitId: string;
    year: string;
    period: UnitPeriod;
    // Map of studentId -> { week_N: [status, status, status, status, status] }
    records: {
        [studentId: string]: {
            [week: string]: AttendanceStatus[];
        };
    };
}
