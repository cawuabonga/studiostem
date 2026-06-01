
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'SuperAdmin' | 'Student' | 'Teacher' | 'Coordinator' | 'Admin';

export interface SocialLinks {
    linkedin?: string;
    github?: string;
    facebook?: string;
    instagram?: string;
    web?: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  documentId?: string;
  instituteId: string | null;
  roleId?: string; 
  permissions?: Permission[];
  programId?: string;
  programName?: string;
  currentSemester?: number;
  turno?: UnitTurno;
  bio?: string;
  socialLinks?: SocialLinks;
}

export type StudentAcademicStatus = 'Cursando' | 'Egresado' | 'Titulado' | 'Retirado';

export interface StudentProfile {
  id?: string;
  documentId: string;
  firstName: string;
  lastName:string;
  fullName: string;
  gender: 'Masculino' | 'Femenino';
  birthDate?: Timestamp;
  age: number;
  email: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  programId: string;
  admissionYear: string;
  admissionPeriod: UnitPeriod;
  turno: UnitTurno;
  role: 'Student';
  roleId: 'student';
  condition?: 'NOMBRADO' | 'CONTRATADO';
  rfidCardId?: string;
  linkedUserUid?: string | null;
  academicStatus?: StudentAcademicStatus;
  graduationYear?: string;
  currentSemester?: number;
  bio?: string;
  socialLinks?: SocialLinks;
}

export interface StaffProfile {
  documentId: string;
  displayName: string;
  email: string;
  phone?: string;
  role: UserRole;
  roleId: string;
  condition: 'NOMBRADO' | 'CONTRATADO';
  programId: string;
  rfidCardId?: string;
  linkedUserUid?: string | null;
  bio?: string;
  socialLinks?: SocialLinks;
}

export interface AccessPoint {
    id: string;
    accessPointId: string;
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
    userRole?: string;
    userRoleId?: string;
    accessPointId: string;
    accessPointName?: string;
    rfidCardId?: string;
    instituteId?: string;
}

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
  logoUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  layout?: 'side' | 'center';
  title?: string;
  slogan?: string;
  creationYear?: string;
  creators?: string;
  contactInfo?: string;
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
  primaryColor?: string;
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
  economicSector?: string;
  productiveFamily?: string;
  economicActivity?: string;
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
  moduleId: string;
  semester: number;
  imageUrl?: string;
  isVirtualClassroomActive?: boolean;
  attendanceLimitWeek?: number;
}

export interface Teacher {
  id: string;
  documentId: string;
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  active: boolean;
  condition: 'NOMBRADO' | 'CONTRATADO';
  programId: string;
  programName?: string;
}

export interface Assignment {
  [unitId: string]: string;
}

export interface NonTeachingActivity {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
}

export interface NonTeachingAssignment {
    id: string;
    teacherId: string;
    activityId: string;
    activityName: string;
    assignedHours: number;
    year: string;
    period: UnitPeriod;
}

export type EFSRTStatus = 'Programado' | 'En Curso' | 'Por Evaluar' | 'Aprobado' | 'Desaprobado';

export interface EFSRTVisit {
    id: string;
    date: Timestamp;
    type: 'Presencial' | 'Virtual';
    observations: string;
}

export interface EFSRTAssignment {
    id: string;
    studentId: string;
    studentName: string;
    programId: string;
    moduleId: string;
    moduleName: string;
    supervisorId: string;
    supervisorName: string;
    location: string;
    address?: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: EFSRTStatus;
    studentReportUrl?: string;
    supervisorReportUrl?: string;
    grade?: number;
    observations?: string;
    visits: EFSRTVisit[];
    createdAt: Timestamp;
}

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
  payerId: string;
  payerName: string;
  payerType: PayerType;
  payerAuthUid: string;
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
  observations?: string;
}

export type SupplyUnitOfMeasure = 'Unidad' | 'Caja' | 'Paquete' | 'Resma' | 'Galón' | 'Kilo' | 'Metro' | 'Litro';
export type SupplyCategory = 'Oficina' | 'Aseo' | 'Bebidas' | 'Snacks' | 'Accesorios' | 'Otro';

export interface SupplyItem {
    id: string;
    code: string;
    name: string;
    description?: string;
    unitOfMeasure: SupplyUnitOfMeasure;
    category?: SupplyCategory;
    stock: number;
}

export interface StockHistoryLog {
    id: string;
    timestamp: Timestamp;
    userId: string;
    userName: string;
    change: number;
    newStock: number;
    notes?: string;
}

export type SupplyRequestStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Entregado' | 'Anulado';

export interface SupplyRequestItem {
    itemId: string;
    name: string;
    unitOfMeasure: SupplyUnitOfMeasure;
    requestedQuantity: number;
    approvedQuantity?: number;
}

export interface SupplyRequest {
    id: string;
    code: string;
    requesterId: string;
    requesterName: string;
    requesterAuthUid: string;
    status: SupplyRequestStatus;
    items: SupplyRequestItem[];
    createdAt: Timestamp;
    processedAt?: Timestamp;
    rejectionReason?: string;
    annulmentReason?: string;
    approvedById?: string;
    approvedByName?: string;
    deliveredById?: string;
    deliveredByName?: string;
    annulledById?: string;
    annulledByName?: string;
    pecosaCode?: string;
}

export interface AcademicPeriodSettings {
    startDate: Timestamp;
    endDate: Timestamp;
}

export interface AcademicYearSettings {
    [period: string]: AcademicPeriodSettings;
}

export interface Matriculation {
    id?: string;
    studentId: string;
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
    teacherName?: string;
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
  value: string;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Timestamp | Date;
  fileUrl?: string;
  createdAt: Timestamp;
  indicatorId?: string;
}

export interface TaskSubmission {
    id: string;
    studentName: string;
    fileUrl?: string;
    link?: string;
    submittedAt: Timestamp;
    grade?: number;
    feedback?: string;
}

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
  title?: string;
  fileUrl: string;
  submittedAt: Timestamp;
  grade?: number;
  feedback?: string;
}

export interface GradeEntry {
  type: 'task' | 'manual';
  refId: string;
  label: string;
  grade: number | null;
  weekNumber: number;
}

export interface ManualEvaluation {
    id: string;
    indicatorId: string;
    label: string;
    weekNumber: number;
    createdAt: Timestamp;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  unitId: string;
  programId: string;
  year: string;
  period: UnitPeriod;
  grades: { [indicatorId: string]: GradeEntry[] };
  evaluations: { [indicatorId: string]: ManualEvaluation[] };
  finalGrade: number | null;
  attendancePercentage: number;
  status: 'cursando' | 'aprobado' | 'desaprobado' | 'inhabilitado' | 'retirado';
}

export type AttendanceStatus = 'P' | 'T' | 'F' | 'J' | 'U';

export interface AttendanceRecord {
    id: string;
    unitId: string;
    year: string;
    period: UnitPeriod;
    records: {
        [studentId: string]: {
            [week: string]: AttendanceStatus[];
        };
    };
}

export interface Syllabus {
    summary: string;
    competence: string;
    capacity?: string;
    transversalCompetencies?: string;
    methodology: string;
    bibliography?: string;
}

export interface SyllabusDesignOptions {
    showLogo: boolean;
    showInfoTable: boolean;
    showSignature: boolean;
}

export interface MatriculationReportData {
    program: Program;
    units: {
        unit: Unit;
        teacherName: string | null;
        students: StudentProfile[];
    }[];
}

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
  buildingId: string;
  floor?: number;
}

export type AssetAction = 'create' | 'update' | 'status_change' | 'move';

export interface AssetHistoryLog {
    id: string;
    timestamp: Timestamp;
    userId: string;
    userName: string;
    action: AssetAction;
    details: string;
}

export type AssetGroup = "MAQUINARIAS, EQUIPOS Y MOBILIARIO" | "VEHICULOS" | "OTROS";
export type AssetClass = "EQUIPO" | "MOBILIARIO" | "VEHICULO" | "TERRENO";

export interface AssetType {
    id: string;
    name: string;
    patrimonialCode: string;
    group: AssetGroup;
    class: AssetClass;
    description?: string;
    lastAssignedNumber: number;
}

export interface Asset {
    id: string;
    buildingId: string;
    environmentId: string;
    assetTypeId: string;
    name: string;
    codeOrSerial: string;
    type: AssetClass;
    quantity: 1;
    status: 'Operativo' | 'En Mantenimiento' | 'De Baja';
    acquisitionDate?: Timestamp;
    notes?: string;
    characteristics?: Record<string, any>;
    environmentName?: string;
    buildingName?: string;
    instituteId: string;
}

export interface ScheduleBlock {
    id: string;
    dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';
    startTime: string;
    endTime: string;
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
    startTime: string;
    endTime: string;
    type: TimeBlockType;
    label?: string;
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

export type Permission = 
  | 'academic:program:manage'
  | 'academic:unit:manage'
  | 'academic:unit:manage:own'
  | 'academic:assignment:manage'
  | 'academic:teacher:view'
  | 'academic:workload:view'
  | 'academic:enrollment:manage'
  | 'academic:periods:manage'
  | 'academic:load:view'
  | 'academic:efsrt:manage'
  | 'admin:fees:manage'
  | 'admin:payments:validate'
  | 'admin:access-control:manage'
  | 'admin:attendance:report'
  | 'admin:institute:manage'
  | 'admin:infra:manage'
  | 'admin:supplies:manage'
  | 'admin:deliveries:view'
  | 'users:staff:manage'
  | 'users:student:manage'
  | 'planning:schedule:manage'
  | 'planning:environment:manage'
  | 'planning:schedule:view:own'
  | 'user:supplies:request'
  | 'superadmin:institute:manage'
  | 'superadmin:users:manage'
  | 'superadmin:design:manage'
  | 'superadmin:roles:manage'
  | 'teacher:unit:view'
  | 'teacher:efsrt:supervise'
  | 'student:unit:view'
  | 'student:grades:view'
  | 'student:payments:manage'
  | 'student:efsrt:view';

export interface Role {
  id: string;
  name: string;
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
            { id: 'admin:deliveries:view', label: 'Ver Entregas (PECOSAS)' },
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
            { id: 'academic:efsrt:manage', label: 'Gestionar Experiencias Formativas (EFSRT)' },
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
            { id: 'teacher:efsrt:supervise', label: 'Supervisar Experiencias Formativas (EFSRT)' },
            { id: 'student:unit:view', label: 'Ver sus Unidades Matriculadas' },
            { id: 'student:grades:view', label: 'Ver sus Calificaciones' },
            { id: 'student:payments:manage', label: 'Gestionar sus Pagos' },
            { id: 'student:efsrt:view', label: 'Ver su progreso en EFSRT' },
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

export interface StudentEgresoAudit {
    eligible: boolean;
    pendingUnits: string[];
    pendingEFSRT: string[];
}

export interface AIConfig {
    activeProvider: 'google' | 'ollama';
    ollamaUrl?: string;
    ollamaModel?: string;
    lastUpdated?: Timestamp;
}
