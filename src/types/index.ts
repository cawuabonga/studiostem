
// Keeping Student as a default role for new sign-ups.
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
