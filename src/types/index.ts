

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
  documentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: 'Masculino' | 'Femenino';
  age: number;
  email: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  programId: string;
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
  period: UnitPeriod;
  unitType: UnitType;
  turno: UnitTurno;
  programId: string;
  moduleId: string; // The code of the module, e.g., "MODULO 1 - ET"
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
}

export interface Assignment {
  [unitId: string]: string; // unitId -> teacherId (Document ID)
}
