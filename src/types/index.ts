

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
  // This will hold the dynamic role ID, e.g., "admin_custom", "contador"
  roleId?: string; 
  // Will hold the specific permissions for the user's role
  permissions?: Permission[];
  programName?: string;
}

// Represents a pre-created profile for a staff member, identified by Document ID.
// This is created by an admin and can be "claimed" by a user.
export interface StaffProfile {
  documentId: string;
  displayName: string;
  email: string;
  phone?: string;
  role: UserRole; // This can be deprecated in favor of roleId over time
  roleId: string; // ID of the role document from the 'roles' collection
  condition: 'NOMBRADO' | 'CONTRATADO';
  programId: string;
  rfidCardId?: string; // For Arduino/RFID integration
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
  role: 'Student';
  roleId: 'student';
  condition?: 'NOMBRADO' | 'CONTRATADO'; // Not typically used for students but for consistency
  rfidCardId?: string; // For Arduino/RFID integration
  linkedUserUid?: string | null;
}

export interface AccessPoint {
    id: string; // Firestore Document ID
    accessPointId: string; // User-defined ID (e.g., LAB-01)
    name: string;
    description?: string;
    allowedRoleIds?: string[];
}

export interface AccessLog {
    id: string;
    timestamp: Timestamp;
    type: 'Entrada' | 'Salida';
    status: 'Permitido' | 'Denegado';
    userDocumentId?: string;
    userName?: string;
    userRole?: string; // Human-readable role name, e.g., "Docente"
    userRoleId?: string; // ID of the role, e.g., "teacher"
    accessPointId: string;
    accessPointName?: string;
    rfidCardId?: string;
    instituteId?: string;
}

// NEW: Document to hold the last access state for a user
export interface AccessState {
    lastStateByAccessPoint: {
        [accessPointDocId: string]: {
            type: 'Entrada' | 'Salida';
            timestamp: Timestamp;
        };
    };
}


export interface LoginDesign {
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  layout?: 'side' | 'center';
  title?: string;
  slogan?: string;
  textAlign?: 'left' | 'center' | 'right';
  titleSize?: 'text-2xl' | 'text-3xl' | 'text-4xl';
  sloganSize?: 'text-base' | 'text-lg' | 'text-xl';
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
  publicProfile?: InstitutePublicProfile;
}

export interface InstitutePublicProfile {
    bannerUrl?: string;
    slogan?: string;
    aboutUs?: string;
    contactAddress?: string;
    contactPhone?: string;
    contactEmail?: string;
}

export interface News {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  createdAt: Timestamp;
}

export interface Album {
    id: string;
    name: string;
    description: string;
    coverImageUrl?: string;
    createdAt: Timestamp;
}

export interface Photo {
    id: string;
    albumId: string;
    url: string;
    createdAt: Timestamp;
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
  imageUrl?: string;
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
  condition: 'NOMBRADO' | 'CONTRATADO';
  programId: string;
  programName?: string;
}

export interface Assignment {
  [unitId: string]: string; // unitId -> teacherId (Document ID)
}

// --- NON-TEACHING ACTIVITIES ---

export interface NonTeachingActivity {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
}

export interface NonTeachingAssignment {
    id: string;
    teacherId: string; // Document ID of the staff member
    activityId: string;
    activityName: string; // Denormalized for easy display
    assignedHours: number;
    year: string;
    period: UnitPeriod;
}


// --- PAYMENTS ---
export type PaymentStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Anulado';
export type PayerType = 'student' | 'staff' | 'external';

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
  payerId: string; // documentId of the payer
  payerName: string;
  payerType: PayerType;
  payerAuthUid: string; // UID of user who registered the payment.
  concept: string; 
  amount: number;
  paymentDate: Timestamp;
  operationNumber: string;
  voucherUrl: string;
  status: PaymentStatus;
  createdAt: Timestamp;
  processedAt?: Timestamp;
  receiptNumber?: string; 
  rejectionReason?: string;
  annulmentReason?: string;
}


// --- SUPPLIES & INVENTORY ---
export type SupplyUnitOfMeasure = 'Unidad' | 'Caja' | 'Paquete' | 'Resma' | 'Galón';

export interface SupplyItem {
    id: string;
    name: string;
    description?: string;
    unitOfMeasure: SupplyUnitOfMeasure;
    category?: string;
    stock: number;
}

export interface StockHistoryLog {
    id: string;
    timestamp: Timestamp;
    userId: string;
    userName: string;
    change: number; // e.g., +50 or -5
    newStock: number;
    notes?: string; // e.g., "Compra OC-123" or "Entrega a Juan Perez"
}

export type SupplyRequestStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Entregado';

export interface RequestedSupplyItem {
    itemId: string;
    name: string;
    quantity: number;
    unitOfMeasure: SupplyUnitOfMeasure;
}

export interface SupplyRequest {
    id: string;
    requesterId: string; // User's documentId
    requesterName: string;
    requesterAuthUid: string; // UID of user who made the request
    status: SupplyRequestStatus;
    items: RequestedSupplyItem[];
    createdAt: Timestamp;
    processedAt?: Timestamp;
    rejectionReason?: string;
    deliveredBy?: string; // UID of admin who delivered
}


// --- ACADEMIC & MATRICULATION TYPES ---

export interface AcademicPeriodSettings {
    startDate: Timestamp;
    endDate: Timestamp;
}

export interface AcademicYearSettings {
    [period: string]: AcademicPeriodSettings; // e.g., 'MAR-JUL', 'AGO-DIC'
}


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
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Timestamp | Date;
  fileUrl?: string; // URL to an attached file from the teacher
  createdAt: Timestamp;
}

// New type for the weekly document in Firestore
export interface WeekData {
  weekNumber: number;
  isVisible: boolean;
  contents: Content[];
  tasks: Task[];
  capacityElement: string;
  learningActivities: string;
  basicContents: string;
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

// --- SYLLABUS ---
export interface Syllabus {
    summary: string;
    competence: string;
    methodology: string;
    bibliography?: string;
}

export interface SyllabusDesignOptions {
    showLogo: boolean;
    showInfoTable: boolean;
    showSignature: boolean;
}

// --- Report Data ---
export interface MatriculationReportData {
    program: Program;
    units: {
        unit: Unit;
        teacherName: string | null;
        students: StudentProfile[];
    }[];
}

// --- INFRASTRUCTURE ---

export interface Building {
  id: string;
  name: string;
  code?: string;
  location?: string;
  floorCount?: number;
  dimensions?: { width: number; length: number };
}

export interface Environment {
  id: string;
  name: string;
  code: string;
  type: 'Aula' | 'Laboratorio' | 'Oficina' | 'Auditorio' | 'Taller' | 'Otro';
  capacity: number;
  buildingId: string; // Link to the parent building
  floor?: number;
}

export type AssetAction = 'create' | 'update' | 'status_change' | 'move';

export interface AssetHistoryLog {
    id: string;
    timestamp: Timestamp;
    userId: string;
    userName: string;
    action: AssetAction;
    details: string; // E.g., "Cambió el estado de 'Operativo' a 'En Mantenimiento'."
}

export type AssetGroup = "MAQUINARIAS, EQUIPOS Y MOBILIARIO" | "VEHICULOS" | "OTROS";
export type AssetClass = "EQUIPO" | "MOBILIARIO" | "VEHICULO" | "TERRENO";


export interface AssetType {
    id: string;
    name: string; // Denominación
    patrimonialCode: string; // Código Patrimonial
    group: AssetGroup;
    class: AssetClass;
    description?: string;
    lastAssignedNumber: number; // Para el correlativo
}

export interface Asset {
    id: string;
    buildingId: string;
    environmentId: string;
    assetTypeId: string; // Link to the AssetType in the catalog
    name: string; // Denormalized from AssetType: Denominación
    codeOrSerial: string; // Código patrimonial completo o S/N del fabricante
    type: AssetClass; // Denormalized from AssetType
    quantity: 1; // For individual assets, this is always 1
    status: 'Operativo' | 'En Mantenimiento' | 'De Baja';
    acquisitionDate?: Timestamp;
    notes?: string;
    characteristics?: Record<string, any>; // For dynamic fields: marca, modelo, etc.
    // Denormalized data for reporting
    environmentName?: string;
    buildingName?: string;
    instituteId: string;
}



// --- SCHEDULES / HORARIOS ---
export interface ScheduleBlock {
    id: string;
    dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';
    startTime: string; // e.g., "08:00"
    endTime: string; // e.g., "09:30"
    unitId: string;
    teacherId?: string;
    environmentId?: string;
    programId: string;
    semester: number;
    year: string;
}

export type TimeBlockType = 'clase' | 'receso';

export interface TimeBlock {
    id?: string;
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
    type: TimeBlockType;
    label?: string; // Optional label e.g., "Receso"
}

export interface ScheduleTemplate {
    id: string;
    name: string;
    turnos: {
        mañana: TimeBlock[];
        tarde: TimeBlock[];
        noche: TimeBlock[];
    };
    isDefault: boolean;
}


// --- PERMISSIONS AND ROLES ---
export type Permission = 
  // Academic Management
  | 'academic:program:manage'
  | 'academic:unit:manage'
  | 'academic:unit:manage:own'
  | 'academic:assignment:manage'
  | 'academic:teacher:view'
  | 'academic:workload:view'
  | 'academic:enrollment:manage'
  | 'academic:periods:manage'
  | 'academic:load:view'
  // Administrative Management
  | 'admin:fees:manage'
  | 'admin:payments:validate'
  | 'admin:access-control:manage'
  | 'admin:attendance:report'
  | 'admin:institute:manage'
  | 'admin:infra:manage'
  | 'admin:supplies:manage'
  // User Management
  | 'users:staff:manage'
  | 'users:student:manage'
  // Planning & Schedules
  | 'planning:schedule:manage'
  | 'planning:schedule:view:own'
  // User-specific actions
  | 'user:supplies:request'
  // SuperAdmin
  | 'superadmin:institute:manage'
  | 'superadmin:users:manage'
  | 'superadmin:design:manage'
  | 'superadmin:roles:manage'
  // Teacher
  | 'teacher:unit:view'
  // Student
  | 'student:unit:view'
  | 'student:grades:view'
  | 'student:payments:manage';


export interface Role {
  id: string; // e.g., "admin_custom", "contador_jr"
  name: string; // e.g., "Administrador Custom", "Contador Junior"
  description: string;
  permissions: Record<Permission, boolean>;
}

export const PERMISSIONS_CONFIG: { category: string; description: string; permissions: { id: Permission; label: string }[] }[] = [
    {
        category: 'Gestión del Instituto',
        description: 'Permisos relacionados con la configuración general y la página pública del instituto.',
        permissions: [
            { id: 'admin:institute:manage', label: 'Gestionar Perfil Público del Instituto' },
        ],
    },
    {
        category: 'Gestión Administrativa',
        description: 'Permisos para la gestión de tasas, pagos, infraestructura y control de acceso.',
        permissions: [
            { id: 'admin:fees:manage', label: 'Gestionar Tasas Educativas' },
            { id: 'admin:payments:validate', label: 'Validar Pagos de Estudiantes' },
            { id: 'admin:access-control:manage', label: 'Gestionar Control de Acceso' },
            { id: 'admin:attendance:report', label: 'Ver Reportes de Asistencia de Personal' },
            { id: 'admin:infra:manage', label: 'Gestionar Infraestructura (Edificios, Ambientes, Activos)' },
            { id: 'admin:supplies:manage', label: 'Gestionar Abastecimiento e Insumos' },
        ],
    },
    {
        category: 'Gestión Académica',
        description: 'Permisos relacionados con la administración de programas, unidades, asignaciones y matrículas.',
        permissions: [
            { id: 'academic:program:manage', label: 'Gestionar Programas de Estudio' },
            { id: 'academic:unit:manage', label: 'Gestionar Todas las Unidades Didácticas' },
            { id: 'academic:unit:manage:own', label: 'Gestionar Unidades del Propio Programa (Coordinador)' },
            { id: 'academic:assignment:manage', label: 'Gestionar Asignaciones de Docentes' },
            { id: 'academic:teacher:view', label: 'Ver Lista de Docentes' },
            { id: 'academic:workload:view', label: 'Ver Carga Horaria' },
            { id: 'academic:enrollment:manage', label: 'Gestionar Matrículas' },
            { id: 'academic:periods:manage', label: 'Gestionar Períodos Lectivos' },
            { id: 'academic:load:view', label: 'Ver Dashboard de Carga Académica' },
        ],
    },
     {
        category: 'Planificación y Horarios',
        description: 'Permisos para gestionar ambientes, generar horarios y visualizar la carga horaria.',
        permissions: [
            { id: 'planning:schedule:manage', label: 'Generar y Gestionar Horarios' },
            { id: 'planning:schedule:view:own', label: 'Ver Mi Horario' },
        ],
    },
    {
        category: 'Gestión de Usuarios',
        description: 'Permisos para la creación y gestión de perfiles de personal y estudiantes.',
        permissions: [
            { id: 'users:staff:manage', label: 'Gestionar Personal (Docentes, etc.)' },
            { id: 'users:student:manage', label: 'Gestionar Estudiantes' },
        ],
    },
    {
        category: 'Acciones de Personal',
        description: 'Permisos para acciones que el personal y estudiantes pueden realizar.',
        permissions: [
            { id: 'teacher:unit:view', label: 'Ver sus Unidades Asignadas' },
            { id: 'student:unit:view', label: 'Ver sus Unidades Matriculadas' },
            { id: 'student:grades:view', label: 'Ver sus Calificaciones' },
            { id: 'student:payments:manage', label: 'Gestionar sus Pagos' },
            { id: 'user:supplies:request', label: 'Solicitar Insumos' },
        ],
    },
     {
        category: 'Super Administrador',
        description: 'Permisos de nivel superior para la gestión de toda la plataforma.',
        permissions: [
            { id: 'superadmin:institute:manage', label: 'Gestionar Institutos' },
            { id: 'superadmin:users:manage', label: 'Gestionar Todos los Usuarios' },
            { id: 'superadmin:design:manage', label: 'Gestionar Diseño del Login' },
            { id: 'superadmin:roles:manage', label: 'Gestionar Roles y Permisos' },
        ],
    },
];

    
