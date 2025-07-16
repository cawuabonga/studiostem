

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
  resolution: string;
  duration: string;
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
