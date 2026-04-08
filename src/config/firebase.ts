
// ... existing imports ...
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, addDoc, deleteDoc, writeBatch, where, Timestamp, arrayRemove, arrayUnion, onSnapshot, Unsubscribe, limit, collectionGroup, runTransaction, deleteField, startAfter, endBefore, limitToLast, DocumentSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { AppUser, UserRole, Institute, Program, Unit, Teacher, LoginDesign, LoginImage, ProgramModule, Assignment, StaffProfile, StudentProfile, AchievementIndicator, Content, Task, Matriculation, UnitPeriod, EnrolledUnit, AcademicRecord, ManualEvaluation, AttendanceRecord, Payment, PaymentStatus, PayerType, PaymentConcept, WeekData, Syllabus, Role, Permission, NonTeachingActivity, NonTeachingAssignment, AccessLog, AccessPoint, MatriculationReportData, Environment, ScheduleTemplate, ScheduleBlock, AcademicYearSettings, InstitutePublicProfile, News, Album, Photo, Building, Asset, AssetHistoryLog, AssetType, SupplyItem, StockHistoryLog, SupplyRequest, SupplyRequestStatus, EFSRTAssignment, EFSRTVisit, EFSRTStatus, UnitTurno, TaskSubmission, GradeEntry } from '@/types';

const firebaseConfig = {
  apiKey: "AIzaSyDvjGh3BgWZKeHkXVl0uOkoiWoowjjEX9c",
  authDomain: "stem-v2-4y6a0.firebaseapp.com",
  projectId: "stem-v2-4y6a0",
  storageBucket: "stem-v2-4y6a0.firebasestorage.app",
  messagingSenderId: "865497414457",
  appId: "1:865497414457:web:0ab4345df399f13bfc86e8",
  measurementId: "G-5FP9BYXHPF"
};


let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Analytics if running in the browser
if (typeof window !== 'undefined') {
    getAnalytics(app);
}


const auth = getAuth(app);
const db = getFirestore(app);
const firebaseStorage = getStorage(app);

export { auth, db, firebaseStorage as storage, firebaseUpdateProfile, GoogleAuthProvider, firebaseCreateUser as createUserWithEmailAndPassword };

// Client-side file upload function
export const uploadFileAndGetURL = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(firebaseStorage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

// ... existing functions (saveUserAdditionalData, updateUserProfile, etc.) ...

// --- TASK SUBMISSIONS ---

export const submitTask = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, student: StudentProfile, file: File): Promise<void> => {
    const submissionsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions');
    const storagePath = `institutes/${instituteId}/units/${unitId}/week_${weekNumber}/tasks/${taskId}/submissions/${student.documentId}`;
    
    const fileUrl = await uploadFileAndGetURL(file, storagePath);
    
    await setDoc(doc(submissionsCol, student.documentId), {
        studentName: student.fullName,
        fileUrl,
        submittedAt: Timestamp.now(),
    }, { merge: true });
};

export const getTaskSubmissions = async (instituteId: string, unitId: string, weekNumber: number, taskId: string): Promise<TaskSubmission[]> => {
    const submissionsCol = collection(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions');
    const snapshot = await getDocs(submissionsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskSubmission));
};

export const gradeTaskSubmission = async (instituteId: string, unitId: string, weekNumber: number, taskId: string, taskTitle: string, studentId: string, grade: number, feedback: string): Promise<void> => {
    const submissionRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unitId, 'weeklyPlanner', `week_${weekNumber}`, 'tasks', taskId, 'submissions', studentId);
    
    await updateDoc(submissionRef, { grade, feedback });

    // Sync with Academic Record
    const year = new Date().getFullYear().toString();
    const [allUnits, allIndicators] = await Promise.all([
        getUnits(instituteId),
        getAchievementIndicators(instituteId, unitId)
    ]);
    const unit = allUnits.find(u => u.id === unitId);
    if (!unit) return;

    // Find which indicator this week belongs to
    const indicator = allIndicators.find(ind => weekNumber >= ind.startWeek && weekNumber <= ind.endWeek);
    if (!indicator) return;

    const recordId = `${unitId}_${studentId}_${year}_${unit.period}`;
    const recordRef = doc(db, 'institutes', instituteId, 'academicRecords', recordId);
    const recordSnap = await getDoc(recordRef);

    const gradeEntry: GradeEntry = {
        type: 'task',
        refId: taskId,
        label: taskTitle,
        grade,
        weekNumber
    };

    if (recordSnap.exists()) {
        const recordData = recordSnap.data() as AcademicRecord;
        const currentGrades = recordData.grades || {};
        if (!currentGrades[indicator.id]) currentGrades[indicator.id] = [];
        
        const existingIndex = currentGrades[indicator.id].findIndex(g => g.refId === taskId);
        if (existingIndex !== -1) {
            currentGrades[indicator.id][existingIndex] = gradeEntry;
        } else {
            currentGrades[indicator.id].push(gradeEntry);
        }
        await updateDoc(recordRef, { grades: currentGrades });
    } else {
        const newRecord: Omit<AcademicRecord, 'id'> = {
            studentId,
            unitId,
            programId: unit.programId,
            year,
            period: unit.period,
            grades: { [indicator.id]: [gradeEntry] },
            evaluations: {},
            finalGrade: null,
            attendancePercentage: 100,
            status: 'cursando',
        };
        await setDoc(recordRef, newRecord);
    }
};

// ... existing functions ...
