
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
  phone?: string;
  condition?: 'NOMBRADO' | 'CONTRATADO';
  programId?: string;
  isVerified?: boolean; // Flag to check if user has claimed a profile
}

// Represents a profile created by an Admin, to be claimed by a user.
export interface StaffProfile {
    dni: string;
    displayName: string;
    email: string;
    role: UserRole;
    phone?: string;
    condition?: 'NOMBRADO' | 'CONTRATADO';
    programId?: string;
    claimed: boolean; // To check if this profile has been claimed
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
  url: string; // This will now be a long Base64 Data URI string
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
