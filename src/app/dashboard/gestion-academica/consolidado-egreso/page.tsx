
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfiles, getPrograms, checkEgresoEligibility, promoteToEgresado, getGraduates, getStudentsPaginated, getStudentProfile } from '@/config/firebase';
import type { StudentProfile, Program, StudentEgresoAudit, UnitTurno } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Award, Loader2, Info, AlertTriangle, UserCheck, Search, Printer, GraduationCap, ListChecks, Archive, ArrowRight, UserSquare2, FileStack, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StudentAuditExpediente } from '@/components/egreso/StudentAuditExpediente';
import { BulkUploadGraduates } from '@/components/egreso/BulkUploadGraduates';
import type { DocumentSnapshot } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const semesters = Array.from({ length: 10 }, (_, i) => i + 1);
const turnos: UnitTurno[] = ['Mañana', 'Tarde', 'Noche'];

export default function ConsolidadoEgresoPage() {
    const { instituteId, institute, user, hasPermission } = useAuth();
    const { toast } = useToast();
    
    // Search & Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [programFilter, setProgramFilter] = useState('all');
    const [admissionYearFilter, setAdmissionYearFilter] = useState('all');
    const [turnoFilter, setTurnoFilter] = useState<UnitTurno | 'all'>('all');
    const [semesterFilter, setSemesterFilter] = useState<string>('all');

    // Verification Tab States
    const [candidates, setCandidates] = useState<StudentProfile[]>([]);
    const [eligibilityMap, setEligibilityMap] = useState<Record<string, StudentEgresoAudit>>({});
    
    // Pagination
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [isLastPage, setIsLastPage] = useState(false);
    
    // Graduates Registry Tab States
    const [graduates, setGraduates] = useState<StudentProfile[]>([]);
    const [registryYear, setRegistryYear] = useState('all');
    const [registryProgram, setRegistryProgram] = useState(''); // Empty string as default
    const [hasSearchedRegistry, setHasSearchedRegistry] = useState(false);
    const [hasSearchedCandidates, setHasSearchedCandidates] = useState(false);
    
    // Common States
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingRegistry, setLoadingRegistry] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('verificacion');

    // Modal States
    const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
    const [graduationYear, setGraduationYear] = useState(new Date().getFullYear().toString());

    // Authorization context
    const isFullAdmin = hasPermission('academic:program:manage');
    const userProgramId = user?.programId;

    useEffect(() => {
        if (instituteId) {
            getPrograms(instituteId).then(setPrograms);
        }
    }, [instituteId]);

    useEffect(() => {
        if (userProgramId && !isFullAdmin) {
            setProgramFilter(userProgramId);
            setRegistryProgram(userProgramId);
        }
    }, [userProgramId, isFullAdmin]);

    const handleSearchById = async () => {
        if (!searchTerm || !instituteId) return;
        setLoading(true);
        setHasSearchedCandidates(true);
        try {
            const student = await getStudentProfile(instituteId, searchTerm);
            if (student) {
                setCandidates([student]);
                setIsLastPage(true);
                // Perform quick audit for the single result
                const audit = await checkEgresoEligibility(instituteId, student.documentId);
                setEligibilityMap({ [student.documentId]: audit });
            } else {
                toast({ title: "No encontrado", description: "No existe un estudiante con ese DNI.", variant: "destructive" });
                setCandidates([]);
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchCandidates = useCallback(async (isNextPage = false) => {
        if (!instituteId || programFilter === 'all') {
            toast({ title: "Atención", description: "Seleccione un programa de estudios para consultar." });
            return;
        }
        
        setLoading(true);
        setHasSearchedCandidates(true);
        try {
            const result = await getStudentsPaginated({
                instituteId,
                programId: programFilter,
                admissionYear: admissionYearFilter === 'all' ? undefined : admissionYearFilter,
                turno: turnoFilter === 'all' ? undefined : turnoFilter,
                semester: semesterFilter === 'all' ? undefined : parseInt(semesterFilter),
                limitCount: 25,
                startAfterDoc: isNextPage ? lastVisible : null,
                excludeEgresados: true
            });

            if (isNextPage) setCandidates(prev => [...prev, ...result.students]);
            else setCandidates(result.students);

            setLastVisible(result.lastVisible);
            setIsLastPage(!result.lastVisible || result.students.length < 25);

            // Audit results
            const audits: Record<string, StudentEgresoAudit> = { ...eligibilityMap };
            for (const s of result.students) {
                // Ensure we don't repeat audits already fetched
                if (!audits[s.documentId]) {
                    audits[s.documentId] = await checkEgresoEligibility(instituteId, s.documentId);
                }
            }
            setEligibilityMap(audits);

        } catch (error: any) {
            console.error("[DEBUG] Error fetching candidates:", error);
            toast({ title: "Error al cargar candidatos", description: "Ocurrió un error técnico al consultar la base de datos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, programFilter, admissionYearFilter, turnoFilter, semesterFilter, lastVisible, eligibilityMap, toast]);

    const fetchRegistryData = useCallback(async () => {
        if (!instituteId || !registryProgram || registryProgram === 'none') {
            setGraduates([]);
            setHasSearchedRegistry(false);
            return;
        }
        setLoadingRegistry(true);
        setHasSearchedRegistry(true);
        try {
            const data = await getGraduates(instituteId, { 
                year: registryYear, 
                programId: registryProgram 
            });
            setGraduates(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar el padrón.", variant: "destructive" });
        } finally {
            setLoadingRegistry(false);
        }
    }, [instituteId, registryYear, registryProgram, toast]);

    const handlePromote = async () => {
        if (!instituteId || !selectedStudent) return;
        setIsSubmitting(true);
        try {
            await promoteToEgresado(instituteId, selectedStudent.documentId, graduationYear);
            toast({ title: "Estudiante Promocionado", description: `${selectedStudent.fullName} ahora tiene el Rol de Egresado.` });
            setIsPromoteDialogOpen(false);
            setCandidates(prev => prev.filter(c => c.documentId !== selectedStudent.documentId));
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintConstancia = (student: StudentProfile) => {
        const programName = programs.find(p => p.id === student.programId)?.name || 'N/A';
        const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
        const instituteName = institute?.name || 'INSTITUTO SUPERIOR';
        const logoUrl = institute?.logoUrl || '';
        const address = institute?.publicProfile?.contactAddress || '';
        const phone = institute?.publicProfile?.contactPhone || '';
        const email = institute?.publicProfile?.contactEmail || '';

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Constancia de Egreso - ${student.fullName}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Lato:ital,wght@0,400;0,700;1,400&display=swap');
                        
                        body { 
                            font-family: 'Lato', sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            color: #1a1a1a;
                            background-color: #fff;
                        }
                        .page-container {
                            width: 210mm;
                            height: 297mm;
                            padding: 15mm;
                            box-sizing: border-box;
                            position: relative;
                            margin: auto;
                        }
                        .watermark {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            opacity: 0.05;
                            z-index: 0;
                            width: 500px;
                            height: 500px;
                            object-fit: contain;
                            pointer-events: none;
                        }
                        .content-wrapper {
                            position: relative;
                            z-index: 10;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            border: 1.5px solid #1e3a8a;
                            padding: 15mm;
                            box-sizing: border-box;
                        }
                        header {
                            display: grid;
                            grid-template-columns: 100px 1fr 100px;
                            align-items: center;
                            margin-bottom: 40px;
                            padding-bottom: 25px;
                            border-bottom: 1px solid #eee;
                        }
                        .logo-container {
                            display: flex;
                            justify-content: flex-start;
                        }
                        .logo-main {
                            height: 70px;
                            width: auto;
                            object-fit: contain;
                        }
                        .inst-info {
                            text-align: center;
                        }
                        .inst-name {
                            font-family: 'Montserrat', sans-serif;
                            font-size: 18pt;
                            margin: 0;
                            color: #1e3a8a;
                            text-transform: uppercase;
                            line-height: 1.2;
                        }
                        .title-box {
                            text-align: center;
                            margin: 45px 0;
                        }
                        .main-title {
                            font-family: 'Montserrat', sans-serif;
                            font-size: 30pt;
                            color: #1e3a8a;
                            margin: 0;
                            letter-spacing: -1px;
                        }
                        .body-text {
                            text-align: justify;
                            font-size: 13.5pt;
                            line-height: 1.8;
                            margin: 40px 0;
                            flex-grow: 1;
                        }
                        .highlight {
                            font-weight: 800;
                            text-transform: uppercase;
                            color: #000;
                            border-bottom: 1px solid #ccc;
                        }
                        .date-location {
                            text-align: right;
                            font-size: 11pt;
                            margin-top: 40px;
                            font-style: italic;
                            color: #444;
                        }
                        .signature-section {
                            margin-top: 70px;
                            display: flex;
                            justify-content: space-around;
                            padding-bottom: 40px;
                        }
                        .sig-box {
                            text-align: center;
                            width: 240px;
                            border-top: 1px solid #1a1a1a;
                            padding-top: 12px;
                            font-size: 9.5pt;
                            font-weight: bold;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        footer {
                            text-align: center;
                            font-size: 7.5pt;
                            color: #999;
                            border-top: 1px solid #eee;
                            padding-top: 15px;
                            margin-top: auto;
                        }
                        @media print {
                            body { margin: 0; padding: 0; }
                            .page-container { border: none !important; margin: 0 !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="page-container">
                        ${logoUrl ? `<img src="${logoUrl}" class="watermark" />` : ''}
                        
                        <div class="content-wrapper">
                            <header>
                                <div class="logo-container">
                                    ${logoUrl ? `<img src="${logoUrl}" class="logo-main" />` : ''}
                                </div>
                                <div class="inst-info">
                                    <h1 class="inst-name">${instituteName}</h1>
                                </div>
                                <div class="header-spacer"></div>
                            </header>

                            <div class="title-box">
                                <h2 class="main-title">CONSTANCIA DE EGRESO</h2>
                            </div>

                            <div class="body-text">
                                <p>La Dirección del <strong>${instituteName}</strong>, mediante el presente documento oficial, deja constancia que el estudiante:</p>
                                <p style="text-align: center; font-size: 18pt; margin: 30px 0;" class="highlight">${student.fullName}</p>
                                <p>Ha culminado satisfactoriamente el Plan de Estudios vigente del Programa de Estudios de <span class="highlight">${programName}</span>, habiendo aprobado la totalidad de las unidades didácticas y experiencias formativas en situaciones reales de trabajo (EFSRT) exigidas por la normativa educativa vigente.</p>
                                <p>Se expide la presente a solicitud del interesado para los fines legales, administrativos y de titulación que correspondan.</p>
                            </div>

                            <div class="date-location">
                                Dado en la sede institucional, a los ${today}.
                            </div>

                            <div class="signature-section">
                                <div class="sig-box">
                                    Firma del Director General
                                </div>
                                <div class="sig-box">
                                    Área de Secretaría Académica
                                </div>
                            </div>

                            <footer>
                                ${address} ${phone ? '| Tel: ' + phone : ''} ${email ? '| ' + email : ''}<br/>
                                Documento generado y validado electrónicamente mediante el Sistema STEM V2
                            </footer>
                        </div>
                    </div>
                    <script>
                        window.onload = () => {
                            window.print();
                            setTimeout(() => { window.close(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10"><GraduationCap className="h-24 w-24" /></div>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Award className="h-8 w-8 text-accent" />
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">Consolidado de Egreso</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg">Auditoría académica y padrón oficial de graduados.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-14 bg-muted/50 p-1">
                    <TabsTrigger value="verificacion" className="text-base font-bold"><ListChecks className="mr-2 h-5 w-5" /> Verificación de Candidatos</TabsTrigger>
                    <TabsTrigger value="padron" className="text-base font-bold"><Archive className="mr-2 h-5 w-5" /> Padrón de Egresados</TabsTrigger>
                </TabsList>

                <TabsContent value="verificacion" className="space-y-4 pt-4">
                    {/* Search & Filters */}
                    <Card className="border-t-4 border-t-primary">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Búsqueda y Filtros de Auditoría</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label>Buscar por DNI del Estudiante</Label>
                                    <div className="flex gap-2">
                                        <Input placeholder="Ingrese número de documento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchById()} />
                                        <Button variant="secondary" onClick={handleSearchById} disabled={loading}><Search className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                                <div className="flex-[2] grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Programa</Label>
                                        <Select value={programFilter} onValueChange={setProgramFilter} disabled={!isFullAdmin}>
                                            <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Ver Todos</SelectItem>
                                                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Año de Ingreso</Label>
                                        <Select value={admissionYearFilter} onValueChange={setAdmissionYearFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Todos los Años" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Ver Todos los Años</SelectItem>
                                                {Array.from({ length: 40 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Turno</Label>
                                        <Select value={turnoFilter} onValueChange={v => setTurnoFilter(v as any)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {turnos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-end">
                                        <Button className="w-full" onClick={() => fetchCandidates(false)} disabled={loading || programFilter === 'all'}>
                                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <ListChecks className="mr-2 h-4 w-4" />}
                                            Consultar Grupo
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Candidates Table */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="rounded-md border bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>Estudiante</TableHead>
                                            <TableHead className="text-center">Turno</TableHead>
                                            <TableHead className="text-center">Unidades Pend.</TableHead>
                                            <TableHead className="text-center">EFSRT Pend.</TableHead>
                                            <TableHead className="text-center">Elegibilidad</TableHead>
                                            <TableHead className="text-right">Expediente</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {candidates.length > 0 ? candidates.map(student => {
                                            const audit = eligibilityMap[student.documentId];
                                            return (
                                                <TableRow key={student.documentId}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm uppercase">{student.fullName}</span>
                                                            <span className="text-[10px] font-mono text-muted-foreground">{student.documentId}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center text-xs">{student.turno}</TableCell>
                                                    <TableCell className="text-center">
                                                        {audit?.pendingUnits.length > 0 ? (
                                                            <Badge variant="destructive" className="text-[10px] font-black">{audit.pendingUnits.length}</Badge>
                                                        ) : <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {audit?.pendingEFSRT.length > 0 ? (
                                                            <Badge variant="destructive" className="text-[10px] font-black">{audit.pendingEFSRT.length}</Badge>
                                                        ) : <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {audit?.eligible ? (
                                                            <Badge className="bg-green-100 text-green-800 animate-pulse font-black px-3">EXPEDITO</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px] opacity-60">EN PROCESO</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => { setSelectedStudent(student); setIsAuditModalOpen(true); }}>
                                                                <FileStack className="mr-2 h-4 w-4" /> Ver Auditoría
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-60 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <UserSquare2 className="h-12 w-12 opacity-20" />
                                                        <p>{hasSearchedCandidates ? "No se encontraron candidatos con estos filtros." : "Utilice los filtros superiores para consultar alumnos."}</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {!isLastPage && candidates.length > 0 && (
                                <div className="flex justify-center mt-6">
                                    <Button variant="ghost" onClick={() => fetchCandidates(true)} disabled={loading}>
                                        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Cargar más resultados (25+)
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Padrón Oficial (Egresados) */}
                <TabsContent value="padron" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Graduados</CardTitle>
                            <CardDescription>Consulta el padrón oficial de ex-alumnos del instituto.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg">
                                <div className="space-y-2">
                                    <Label>Año de Promoción</Label>
                                    <Select value={registryYear} onValueChange={setRegistryYear}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Ver Todos los Años</SelectItem>
                                            {Array.from({ length: 40 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                                                <SelectItem key={y} value={y}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Programa de Estudios</Label>
                                    <Select value={registryProgram} onValueChange={setRegistryProgram} disabled={!isFullAdmin}>
                                        <SelectTrigger><SelectValue placeholder="Seleccione un Programa..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Seleccione un Programa --</SelectItem>
                                            {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                    <Button 
                                        variant="outline" 
                                        className="w-full" 
                                        onClick={fetchRegistryData} 
                                        disabled={!registryProgram || registryProgram === 'none' || loadingRegistry}
                                    >
                                        {loadingRegistry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                        Actualizar Padrón
                                    </Button>
                                </div>
                            </div>

                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="bulk-graduates" className="border rounded-xl px-4 bg-muted/10">
                                    <AccordionTrigger className="hover:no-underline py-4 font-bold text-sm uppercase">
                                        <div className="flex items-center gap-2">
                                            <Upload className="h-4 w-4 text-primary" />
                                            <span className="truncate">Carga Masiva de Egresados Históricos</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-6">
                                        <BulkUploadGraduates onUploadSuccess={fetchRegistryData} />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="w-[50px]">N°</TableHead>
                                            <TableHead>Egresado</TableHead>
                                            <TableHead>Carrera</TableHead>
                                            <TableHead className="text-center">Año Egreso</TableHead>
                                            <TableHead className="text-right">Documentos</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingRegistry ? (
                                            <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary" /></TableCell></TableRow>
                                        ) : graduates.length > 0 ? (
                                            graduates.map((egresado, idx) => (
                                                <TableRow key={egresado.documentId}>
                                                    <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="font-bold text-sm uppercase">{egresado.fullName}</div>
                                                        <div className="text-[10px] font-mono opacity-60">{egresado.documentId}</div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">{programs.find(p => p.id === egresado.programId)?.name || 'N/A'}</TableCell>
                                                    <TableCell className="text-center"><Badge variant="outline" className="font-black">{egresado.graduationYear}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-black" onClick={() => handlePrintConstancia(egresado)}>
                                                            <Printer className="mr-1 h-3 w-3" /> CONSTANCIA
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Archive className="h-10 w-10 opacity-20" />
                                                        <p>{hasSearchedRegistry ? "No se encontraron egresados con los filtros seleccionados." : "Utilice los filtros superiores para cargar el padrón del programa seleccionado."}</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Audit Modal (Expediente) */}
            <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
                <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col">
                    <DialogHeader className="flex flex-row justify-between items-start border-b pb-4">
                        <div>
                            <DialogTitle className="text-xl">Auditoría Integral de Egreso</DialogTitle>
                            <DialogDescription>Verificación exhaustiva de requisitos académicos y administrativos.</DialogDescription>
                        </div>
                        {eligibilityMap[selectedStudent?.documentId || '']?.eligible && (
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsPromoteDialogOpen(true)}>
                                <UserCheck className="mr-2 h-4 w-4" /> Egresar Estudiante
                            </Button>
                        )}
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pt-4">
                        {selectedStudent && instituteId && (
                            <StudentAuditExpediente 
                                studentId={selectedStudent.documentId} 
                                instituteId={instituteId} 
                                program={programs.find(p => p.id === selectedStudent.programId)!}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Promote Dialog */}
            <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" /> Confirmar Egreso Oficial</DialogTitle>
                        <DialogDescription>
                            Al confirmar, el estado de <strong>{selectedStudent?.fullName}</strong> cambiará a "Egresado" y se le asignará el Rol de Egresado automáticamente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Año de Graduación</Label>
                            <Input value={graduationYear} onChange={e => setGraduationYear(e.target.value)} />
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-md flex gap-3 text-xs text-amber-800">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p>Esta acción es oficial. El usuario pasará al padrón histórico y su acceso al sistema se limitará a funciones de Egresado.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPromoteDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handlePromote} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Egreso
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
