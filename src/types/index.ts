
export type UserRole = 'Student' | 'Teacher' | 'Coordinator' | 'Admin';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

export type UnitPeriod = 'MAR-JUL' | 'AGOS-DIC';
export type UnitType = 'Específica' | 'Empleabilidad';

export interface DidacticUnit {
  id: string;
  name: string;
  studyProgram: string;
  period: UnitPeriod;
  module: string;
  credits: number;
  theoreticalHours: number;
  practicalHours: number;
  numberOfGroups: number;
  totalHours: number;
  unitType: UnitType;
}

export interface StudyProgram {
  id: string;
  code: string;
  name: string;
}
