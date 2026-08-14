
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'SuperAdmin' | 'Student' | 'Teacher' | 'Coordinator' | 'Admin' | 'Company' | 'Graduate';

export interface SocialLinks {
    linkedin?: string;
    github?: string;
    facebook?: string;
    instagram?: string;
    web?: string;
}

// --- EDA (Elaboración de Documentos Automáticos) ---

export type PrintPointStatus = 'Online' | 'Offline' | 'Mantenimiento';
export type PrinterStatus = 'Online' | 'Offline' | 'Error' | 'Printing' | 'Warmup';
export type PaperStatus = 'OK' | 'Low' | 'Empty' | 'Jam';
export type DocumentCategory = 'Constancia' | 'Boleta' | 'Ficha' | 'Solicitud';
export type EDARequirement = 'Gratuito' | 'Pago Validado';
export type EDALayoutType = 'structured_solicitud' | 'raw_html';
export type AddresseeType = 'Director' | 'Coordinator';

export interface PrintPoint {
    id: string;
    pointId: string; // Identificador técnico (ej: EDA-01)
    name: string;
    location: string;
    status: PrintPointStatus;
    lastHeartbeat?: Timestamp;
    instituteId: string;
    backgroundImageUrl?: string;
    // Configuración de Kiosko
    allowManualLogin?: boolean;
    inactivityTimeout?: number; // Segundos antes del auto-logout
    // Sesión activa para el Kiosko
    currentStudentId?: string | null;
    lastScanAt?: Timestamp | null;
    // Estado del Hardware de Impresión
    printerName?: string;
    printerStatus?: PrinterStatus;
    paperStatus?: PaperStatus;
    tonerLevel?: number; // 0-100
}

export interface DocumentTemplate {
    id: string;
    name: string;
    category: DocumentCategory;
    content: string; // Estructura HTML/Markdown de la plantilla o Cuerpo en estructurados
    variables: string[]; // Listado de llaves (ej: {nombre}, {ciclo})
    requirementType: EDARequirement;
    requirementValue?: string; // Código de la tasa si requiere pago
    isActive: boolean;
    instituteId: string;
    createdAt: Timestamp;
    // Campos para diseño estructurado
    layoutType: EDALayoutType;
    sumilla?: string;
    addresseeType?: AddresseeType;
    addresseeRole?: string; // 'Director General', 'Coordinador Académico', etc.
    directorName?: string; // Nombre del director si addresseeType === 'Director'
}

export interface DocumentGenerationLog {
    id: string;
    timestamp: Timestamp;
    studentId: string;
    studentName: string;
    templateId: string;
    templateName: string;
    printPointId: string;
    status: 'Exitoso' | 'Fallido';
    instituteId: string;
}

// --- Fin EDA ---

// --- Salud y Tópico ---

export type BloodType = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
export type InsuranceType = 'SIS' | 'EsSalud' | 'Privado' | 'Ninguno';

export interface MedicalInfo {
    bloodType?: BloodType;
    allergies: string[];
    chronicDiseases?: string;
    permanentMedications?: string;
    insuranceType?: InsuranceType;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    lastUpdate?: Timestamp;
}

export interface MedicalConsultation {
    id: string;
    patientId: string; // DNI
    patientName: string;
    patientRole: string;
    date: Timestamp;
    reason: string;
    triage: {
        weight?: number; // kg
        height?: number; // cm
        temperature?: number; // °C
        bloodPressure?: string; // 120/80
        heartRate?: number; // bpm
    };
    diagnosis: string;
    treatment: string;
    medicationsDelivered?: string;
    responsibleId: string; // UID del médico/enfermero
    responsibleName: string;
}

// --- Fin Salud ---

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  documentId?: string;
  instituteId: string | null;
  roleId?: string; 
  roleName?: string; 
  permissions?: Permission[];
  programId?: string;
  programName?: string;
  currentSemester?: number;
  turno?: UnitTurno;
  bio?: string;
  skills?: string[];
  socialLinks?: SocialLinks;
  coverImageUrl?: string;
  cvUrl?: string; 
  badges?: string[]; 
  medicalInfo?: MedicalInfo;
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
  cvUrl?: string; 
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
  innovationPoints?: number;
  medicalInfo?: MedicalInfo;
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
  medicalInfo?: MedicalInfo;
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

// --- ABP / PBL ---

export interface RubricCriteria {
    id: string;
    label: string;
    description: string;
    maxPoints: number;
}

export type ProjectVisibility = 'Borrador' | 'Interno' | 'Ecosistema Nacional';

export interface Project {
    id: string;
    unitId: string;
    instituteId: string;
    title: string;
    description: string;
    objective: string;
    competencies: string;
    rubrics: RubricCriteria[];
    visibility: ProjectVisibility;
    fabLabRequired: boolean;
    createdAt: Timestamp;
    authorId: string;
    authorName: string;
}

export interface ProjectTeam {
    id: string;
    projectId: string;
    name: string;
    memberIds: string[]; // DocumentIds de los estudiantes
    leaderId: string;
    progress: number; // 0-100
}

export interface ProjectEvidence {
    id: string;
    projectId: string;
    teamId: string;
    studentId: string;
    weekNumber: number;
    title: string;
    description: string;
    fileUrl?: string;
    link?: string;
    submittedAt: Timestamp;
    grade?: number;
    feedback?: string;
    fabLabValidated?: boolean; 
}

// --- Fin ABP ---

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
    programIds: string[]; 
    minSemester: number; 
    status: 'Abierta' | 'Cerrada';
    createdAt: Timestamp;
    deadline?: Timestamp;
    vacancies?: number; 
    applicantCount?: number; 
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
    studentType: string; 
    cvUrl: string; 
    status: 'Pendiente' | 'Visto' | 'En Proceso' | 'Aceptado' | 'Rechazado';
    appliedAt: Timestamp;
    notes?: string;
    interviewDate?: Timestamp; 
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
  planId?: string; 
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
  isClosed?: boolean;
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
    evidenceUrls?: string[];
    evidenceDescription?: string;
    lastUpdate?: Timestamp;
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
  | 'academic:workload:monitor'
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
  | 'admin:health:manage'
  | 'admin:eda:manage'
  | 'users:staff:manage'
  | 'users:student:manage'
  | 'planning:schedule:manage'
  | 'planning:environment:manage'
  | 'planning:schedule:view:own'
  | 'user:supplies:request'
  | 'user:access:view:own'
  | 'user:medical:view:own'
  | 'user:eda:use'
  | 'superadmin:institute:manage'
  | 'superadmin:users:manage'
  | 'superadmin:design:manage'
  | 'superadmin:roles:manage'
  | 'superadmin:plans:manage'
  | 'superadmin:observability:view'
  | 'teacher:unit:view'
  | 'teacher:efsrt:supervise'
  | 'teacher:workload:report'
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

export interface EnrolledUnit extends Unit {
    programName: string;
    enrollmentYear: string;
}

export interface GradeEntry {
    type: 'task' | 'manual';
    refId: string;
    label: string;
    grade: number | null;
    weekNumber: number;
}

export interface AcademicRecord {
    id: string;
    studentId: string;
    unitId: string;
    programId: string;
    year: string;
    period: UnitPeriod;
    grades: Record<string, GradeEntry[]>; // indicatorId -> list of grades
    evaluations: Record<string, ManualEvaluation[]>; // indicatorId -> list of manual headers
    attendance?: Record<string, AttendanceStatus[]>; // week_1 -> ['P', 'F']
    finalGrade: number | null;
    attendancePercentage: number;
    status: 'cursando' | 'aprobado' | 'desaprobado' | 'retirado';
    instituteId: string; // Requerido para consultas de grupo
}

export interface ManualEvaluation {
    id: string;
    indicatorId: string;
    label: string;
    weekNumber: number;
    createdAt: Timestamp;
}

export interface AttendanceRecord {
    id: string; // unitId_year_period
    unitId: string;
    year: string;
    period: UnitPeriod;
    records: Record<string, Record<string, AttendanceStatus[]>>; // studentId -> weekKey -> statuses
}

export type AttendanceStatus = 'P' | 'T' | 'F' | 'J' | 'U'; // Present, Tardy, Absent, Justified, Unknown

export interface WeekData {
    weekNumber: number;
    isVisible: boolean;
    contents: Content[];
    tasks: Task[];
    capacityElement: string;
    learningActivities: string;
    basicContents: string;
}

export interface Content {
    id: string;
    title: string;
    type: 'text' | 'link' | 'file';
    value: string;
    createdAt: Timestamp;
}

export type ContentType = Content['type'];

export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate: Timestamp;
    createdAt: Timestamp;
    fileUrl?: string;
    referenceLink?: string;
    indicatorId?: string; // Optional link to learning achievement
}

export interface TaskSubmission {
    id: string; // studentId
    studentName: string;
    submittedAt: Timestamp;
    fileUrl?: string;
    link?: string;
    grade?: number;
    feedback?: string;
}

export interface Syllabus {
    summary: string;
    competence: string;
    capacity?: string;
    transversalCompetencies?: string;
    methodology: string;
    evaluation?: string;
    bibliography: string;
}

export interface AcademicYearSettings {
    [period: string]: {
        startDate: Timestamp;
        endDate: Timestamp;
    }
}

export interface SyllabusDesignOptions {
    showLogo: boolean;
    showInfoTable: boolean;
    showSignature: boolean;
}

export interface ScheduleBlock {
    id: string;
    dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
    startTime: string;
    endTime: string;
    unitId: string;
    teacherId?: string;
    environmentId?: string;
    programId: string;
    semester: number;
    period: UnitPeriod;
    year: string;
    turno: UnitTurno;
}
