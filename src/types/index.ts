
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'SuperAdmin' | 'Student' | 'Teacher' | 'Coordinator' | 'Admin' | 'Company' | 'Graduate';

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
  roleName?: string; // Nombre amigable del rol desde la DB
  permissions?: Permission[];
  programId?: string;
  programName?: string;
  currentSemester?: number;
  turno?: UnitTurno;
  bio?: string;
  skills?: string[];
  socialLinks?: SocialLinks;
  coverImageUrl?: string;
  cvUrl?: string; // Enlace al PDF de hoja de vida
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
  coverImageUrl?: string;
  cvUrl?: string; // PDF
  programId: string;
  admissionYear: string;
  admissionPeriod: UnitPeriod;
  turno: UnitTurno;
  role: 'Student' | 'Graduate';
  roleId: 'student' | 'graduate';
  condition?: 'NOMBRADO' | 'CONTRATADO';
  rfidCardId?: string;
  linkedUserUid?: string | null;
  academicStatus?: StudentAcademicStatus;
  graduationYear?: string;
  currentSemester?: number;
  bio?: string;
  skills?: string[];
  socialLinks?: SocialLinks;
}

export interface StaffProfile {
  documentId: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  coverImageUrl?: string;
  role: UserRole;
  roleId: string;
  condition: 'NOMBRADO' | 'CONTRATADO';
  programId: string;
  rfidCardId?: string;
  linkedUserUid?: string | null;
  bio?: string;
  skills?: string[];
  socialLinks?: SocialLinks;
}

export interface CompanyProfile {
    documentId: string; // RUC
    name: string;
    industry: string;
    contactEmail: string;
    contactPhone?: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    address?: string;
    representativeName?: string;
    agreementStartDate?: Timestamp;
    agreementEndDate?: Timestamp;
    linkedUserUid?: string | null;
    role: 'Company';
    roleId: string;
    instituteId: string;
}

export type JobOfferSource = 'Interna' | 'LinkedIn' | 'CompuTrabajo' | 'Indeed' | 'Portal de Estado' | 'Otros';

export interface JobOffer {
    id: string;
    companyId: string;
    companyName: string;
    companyLogo?: string;
    companyAddress?: string;
    isVerified?: boolean;
    title: string;
    description: string;
    requirements: string[];
    location: string;
    salaryRange?: string;
    modality: 'Presencial' | 'Remoto' | 'Híbrido';
    jobType: 'Trabajo (Laboral)' | 'Prácticas (EFSRT)';
    contractType: 'Tiempo Completo' | 'Medio Tiempo' | 'Por Proyecto';
    programIds: string[]; // Carreras a las que apunta
    minSemester: number; // Mínimo semestre requerido para postular
    status: 'Abierta' | 'Cerrada';
    createdAt: Timestamp;
    deadline?: Timestamp;
    vacancies?: number; // Número de vacantes disponibles
    applicantCount?: number; // Contador de postulantes
    // New fields for Job Monitor & External jobs
    isExternal?: boolean;
    externalUrl?: string;
    source?: JobOfferSource;
}

export interface JobApplication {
    id: string;
    jobId: string;
    jobTitle: string;
    companyId: string;
    companyName: string;
    studentId: string;
    studentName: string;
    studentType: string; // Estudiante o Egresado
    cvUrl: string; // Copia del CV al momento de postular
    status: 'Pendiente' | 'Visto' | 'En Proceso' | 'Aceptado' | 'Rechazado';
    appliedAt: Timestamp;
    notes?: string;
    interviewDate?: Timestamp; // Nueva: Para agendar entrevistas
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
  planId?: string; // ID del plan asignado
}

export interface InstitutePublicProfile {
    bannerUrl?: string;
    slogan?: string;
    aboutUs?: string;
    contactAddress?: string;
    contactPhone?: string;
    contactEmail?: string;
}

export interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    billingCycle: 'mensual' | 'anual';
    features: string[];
    isActive: boolean;
    createdAt: Timestamp;
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
  | 'admin:companies:manage'
  | 'admin:jobs:monitor'
  | 'users:staff:manage'
  | 'users:student:manage'
  | 'planning:schedule:manage'
  | 'planning:environment:manage'
  | 'planning:schedule:view:own'
  | 'user:supplies:request'
  | 'user:access:view:own'
  | 'superadmin:institute:manage'
  | 'superadmin:users:manage'
  | 'superadmin:design:manage'
  | 'superadmin:roles:manage'
  | 'superadmin:plans:manage'
  | 'superadmin:observability:view'
  | 'teacher:unit:view'
  | 'teacher:efsrt:supervise'
  | 'student:unit:view'
  | 'student:grades:view'
  | 'student:payments:manage'
  | 'student:efsrt:view'
  | 'student:jobs:view'
  | 'student:jobs:apply'
  | 'graduate:jobs:view'
  | 'graduate:profile:view'
  | 'company:jobs:manage'
  | 'company:applicants:view';

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
            { id: 'admin:companies:manage', label: 'Gestionar Empresas Aliadas' },
            { id: 'admin:jobs:monitor', label: 'Monitorear Ofertas Laborales' },
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
            { id: 'user:access:view:own', label: 'Ver Mi Historial de Accesos' },
        ],
    },
     {
        category: 'Acciones de Egresados',
        description: 'Permisos específicos para los estudiantes que han culminado sus estudios.',
        permissions: [
            { id: 'graduate:jobs:view', label: 'Ver Bolsa Laboral para Egresados' },
            { id: 'graduate:profile:view', label: 'Ver Perfil Público de Egresado' },
        ],
    },
     {
        category: 'Bolsa Laboral',
        description: 'Permisos para la gestión de empleo y reclutamiento.',
        permissions: [
            { id: 'student:jobs:view', label: 'Ver Ofertas Laborales' },
            { id: 'student:jobs:apply', label: 'Postular a Empleos' },
            { id: 'company:jobs:manage', label: 'Publicar y Gestionar Ofertas (Empresa)' },
            { id: 'company:applicants:view', label: 'Ver Perfiles de Postulantes' },
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
            { id: 'superadmin:plans:manage', label: 'Gestionar Planes de Servicio' },
            { id: 'superadmin:observability:view', label: 'Ver Métricas de Observabilidad' },
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

export interface DailyActivity {
    total: number;
    student: number;
    teacher: number;
    admin: number;
    coordinator: number;
    graduate: number;
    company: number;
    lastUpdate: Timestamp;
}

export interface InstituteMetrics {
    totalStudents: number;
    totalStaff: number;
    totalUnits: number;
    activeToday: DailyActivity;
    totalPayments: number;
    totalRevenue: number;
}
