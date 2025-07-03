
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
export type Shift = 'Mañana' | 'Tarde' | 'Noche';

export interface DidacticUnit {
  id: string;
  name: string;
  studyProgram: string;
  period: UnitPeriod;
  module: string;
  credits: number;
  theoreticalHours: number;
  practicalHours: number;
  totalHours: number;
  unitType: UnitType;
  shift?: Shift;
}

export interface StudyProgram {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
}

export interface UnitFilters {
  name?: string;
  studyProgram?: string;
  period?: string;
  module?: string;
}

export type TeacherCondition = 'Nombrado' | 'Contratado';

export interface Teacher {
  id: string;
  dni: string;
  fullName: string;
  studyProgram: string;
  condition: TeacherCondition;
  email: string;
  phone: string;
}

export interface UnitAssignment {
  id: string;
  year: number;
  period: UnitPeriod;
  unitId: string;
  unitName: string;
  teacherId: string;
  teacherName: string;
  studyProgram: string;
  totalHours: number;
  shift?: Shift;
}
