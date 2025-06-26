export type UserRole = 'Student' | 'Teacher' | 'Coordinator' | 'Admin';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

export interface DidacticUnit {
  id?: string;
  name: string;
  credits: number;
  theoreticalHours: number;
  practicalHours: number;
  hasGroups: boolean;
  totalHours: number;
}
