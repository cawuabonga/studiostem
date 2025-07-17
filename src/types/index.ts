
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
  password?: string; // Only used for creation, not stored
  phone?: string;
  condition?: 'NOMBRADO' | 'CONTRATADO';
  programId?: string;
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

export interface Program {
  id: string;
  name: string;
  code: string;
  abbreviation: string;
  duration: string;
  moduleCount: number;
  moduleNames: string[];
}

export interface Unit {
  id: string;
  name: string;
  code: string;
  credits: number;
  semester: number;
  programId: string;
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
