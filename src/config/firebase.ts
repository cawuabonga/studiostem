
// ... (previous imports and initializations)

// --- EFSRT (EXPERIENCIAS FORMATIVAS) ---

export const getEFSRTAssignmentsForStudent = async (instituteId: string, studentId: string): Promise<EFSRTAssignment[]> => {
    const efsrtCol = getSubCollectionRef(instituteId, 'efsrtAssignments');
    const q = query(efsrtCol, where("studentId", "==", studentId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EFSRTAssignment));
};

export const getEFSRTAssignmentsForSupervisor = async (instituteId: string, supervisorId: string): Promise<EFSRTAssignment[]> => {
    const efsrtCol = getSubCollectionRef(instituteId, 'efsrtAssignments');
    const q = query(efsrtCol, where("supervisorId", "==", supervisorId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EFSRTAssignment));
};

export const programEFSRT = async (instituteId: string, data: Omit<EFSRTAssignment, 'id' | 'status' | 'createdAt' | 'visits' | 'studentReportUrl' | 'supervisorReportUrl' | 'grade' | 'observations'>): Promise<void> => {
    const efsrtCol = getSubCollectionRef(instituteId, 'efsrtAssignments');
    const newAssignment: Omit<EFSRTAssignment, 'id'> = {
        ...data,
        status: 'Programado',
        visits: [],
        createdAt: Timestamp.now(),
    };
    await addDoc(efsrtCol, newAssignment);
};

export const updateEFSRTStatus = async (instituteId: string, assignmentId: string, status: EFSRTStatus): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    await updateDoc(docRef, { status });
};

export const registerEFSRTVisit = async (instituteId: string, assignmentId: string, visit: Omit<EFSRTVisit, 'id'>): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    const newVisit: EFSRTVisit = {
        ...visit,
        id: doc(collection(db, 'idGenerator')).id,
    };
    await updateDoc(docRef, {
        visits: arrayUnion(newVisit),
        status: 'En Curso' // Automatically move to 'En Curso' when a visit is registered
    });
};

export const uploadEFSRTReport = async (instituteId: string, assignmentId: string, type: 'student' | 'supervisor', file: File): Promise<void> => {
    const storagePath = `institutes/${instituteId}/efsrt/${assignmentId}/${type}_report`;
    const downloadURL = await uploadFileAndGetURL(file, storagePath);
    
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    const updateField = type === 'student' ? 'studentReportUrl' : 'supervisorReportUrl';
    
    await updateDoc(docRef, { 
        [updateField]: downloadURL,
        ...(type === 'student' && { status: 'Por Evaluar' })
    });
};

export const evaluateEFSRT = async (instituteId: string, assignmentId: string, grade: number, observations: string): Promise<void> => {
    const docRef = doc(db, 'institutes', instituteId, 'efsrtAssignments', assignmentId);
    const status = grade >= 13 ? 'Aprobado' : 'Desaprobado';
    await updateDoc(docRef, { grade, observations, status });
};

// --- EGRESO LOGIC ---

export const checkEgresoEligibility = async (instituteId: string, studentId: string): Promise<{ eligible: boolean; pendingUnits: string[]; pendingEFSRT: string[] }> => {
    const [programData, matriculations, efsrtAssignments, allUnits] = await Promise.all([
        getStudentProfile(instituteId, studentId).then(p => p ? getPrograms(instituteId).then(progs => progs.find(pr => pr.id === p.programId)) : null),
        getMatriculationsForStudent(instituteId, studentId),
        getEFSRTAssignmentsForStudent(instituteId, studentId),
        getUnits(instituteId)
    ]);

    if (!programData) return { eligible: false, pendingUnits: [], pendingEFSRT: [] };

    // 1. Check Units (All units of the program must be approved)
    const programUnits = allUnits.filter(u => u.programId === programData.id);
    const approvedUnitIds = new Set(matriculations.filter(m => m.status === 'aprobado').map(m => m.unitId));
    
    const pendingUnits = programUnits
        .filter(u => !approvedUnitIds.has(u.id))
        .map(u => u.name);

    // 2. Check EFSRT (One approved EFSRT for each module)
    const approvedModuleCodes = new Set(efsrtAssignments.filter(a => a.status === 'Aprobado').map(a => a.moduleId));
    const pendingEFSRT = programData.modules
        .filter(m => !approvedModuleCodes.has(m.code))
        .map(m => m.name);

    const eligible = pendingUnits.length === 0 && pendingEFSRT.length === 0;

    return { eligible, pendingUnits, pendingEFSRT };
};

export const promoteToEgresado = async (instituteId: string, studentId: string, graduationYear: string): Promise<void> => {
    const studentRef = doc(db, 'institutes', instituteId, 'studentProfiles', studentId);
    await updateDoc(studentRef, { 
        academicStatus: 'Egresado',
        graduationYear
    });
    
    // Also update the linked user account if exists
    const profileSnap = await getDoc(studentRef);
    const linkedUid = profileSnap.data()?.linkedUserUid;
    if (linkedUid) {
        await updateDoc(doc(db, 'users', linkedUid), { academicStatus: 'Egresado' });
    }
};

// ... (existing functions)
