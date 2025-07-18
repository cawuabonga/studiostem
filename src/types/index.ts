
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'SuperAdmin' | 'Student' | 'Teacher' | 'Coordinator' | 'Admin';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  dni?: string;
  instituteId: string | null;
}

// Represents a pre-created profile for a staff member, identified by DNI.
// This is created by an admin and can be "claimed" by a user.
export interface StaffProfile {
  dni: string;
  displayName: string;
  email: string;
  phone?: string;
  role: UserRole;
  condition: 'NOMBRADO' | 'CONTRATADO';
  programId: string;
  // This will be null until a user account is linked
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
  programId: string;
  moduleId: string; // The code of the module, e.g., "MODULO 1 - ET"
}

export interface Teacher {
  id: string;
  dni: string;
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  active: boolean;
}

export interface Assignment {
  [unitId: string]: string; // unitId -> teacherId
}
