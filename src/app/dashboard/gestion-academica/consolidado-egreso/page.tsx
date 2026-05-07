"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfiles, getPrograms, checkEgresoEligibility, promoteToEgresado, getGraduates } from '@/config/firebase';
import type { StudentProfile, Program } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Award, Loader2, Info, AlertTriangle, UserCheck, Search, Printer, GraduationCap, ListChecks, Archive } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EligibilityResult {
    eligible: boolean;
    pendingUnits: string[];
    pendingEFSRT: string[];
}

export default function ConsolidadoEgresoPage() {
    const { instituteId, institute } = useAuth();
    const { toast } = useToast();
    
    // Process Tab States
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [eligibilityMap, setEligibilityMap] = useState<Record<string, EligibilityResult>>({});
    
    // Graduates Registry Tab States
    const [graduates, setGraduates] = useState<StudentProfile[]>([]);
    const [registryYear, setRegistryYear] = useState('all');
    const [registryProgram, setRegistryProgram] = useState('all');
    
    // Common States
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingRegistry, setLoadingRegistry] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('verificacion');

    // Promotion Dialog States
    const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
    const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
    const [graduationYear, setGraduationYear] = useState(new Date().getFullYear().toString());

    const fetchValidationData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [fetchedStudents, fetchedPrograms] = await Promise.all([
                getStudentProfiles(instituteId),
                getPrograms(instituteId)
            ]);
            
            const activeStudents = fetchedStudents.filter(s => !s.academicStatus || s.academicStatus === 'Cursando');
            setStudents(activeStudents);
            setPrograms(fetchedPrograms);

            const results: Record<string, EligibilityResult> = {};
            for (const student of activeStudents) {
                results[student.documentId] = await checkEgresoEligibility(instituteId, student.documentId);
            }
            setEligibilityMap(results);

        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los datos de egreso.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    const fetchRegistryData = useCallback(async () => {
        if (!instituteId) return;
        setLoadingRegistry(true);
        try {
            const data = await getGraduates(instituteId, { 
                year: registryYear, 
                programId: registryProgram 
            });
            setGraduates(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar el padrón de egresados.", variant: "destructive" });
        } finally {
            setLoadingRegistry(false);
        }
    }, [instituteId, registryYear, registryProgram, toast]);

    useEffect(() => {
        if (activeTab === 'verificacion') fetchValidationData();
        else fetchRegistryData();
    }, [activeTab, fetchValidationData, fetchRegistryData]);

    const handlePromote = async () => {
        if (!instituteId || !selectedStudent) return;
        setIsSubmitting(true);
        try {
            await promoteToEgresado(instituteId, selectedStudent.documentId, graduationYear);
            toast({ title: "Estudiante Promocionado", description: `${selectedStudent.fullName} ahora tiene el estado de Egresado.` });
            setIsPromoteDialogOpen(false);
            fetchValidationData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el estado del estudiante.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintConstancia = (student: StudentProfile) => {
        const programName = programs.find(p => p.id === student.programId)?.name || 'N/A';
        const today = format(new Date(), 'dd MMMM yyyy', { locale: es });

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Constancia de Egreso - ${student.fullName}</title>
                    <style>
                        body { font-family: sans-serif; padding: 50px; line-height: 1.6; color: #000; }
                        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
                        .header img { max-width: 100px; }
                        .title { text-align: center; text-decoration: underline; font-weight: bold; font-size: 1.5em; margin-bottom: 50px; }
                        .content { text-align: justify; font-size: 1.1em; margin-bottom: 80px; }
                        .footer { margin-top: 100px; display: flex; justify-content: space-around; text-align: center; }
                        .signature { border-top: 1px solid #000; padding-top: 10px; width: 250px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        ${institute?.logoUrl ? `<img src="${institute.logoUrl}" />` : ''}
                        <h1>${institute?.name || 'INSTITUTO DE EDUCACIÓN SUPERIOR'}</h1>
                        <p>SECRETARÍA ACADÉMICA</p>
                    </div>
                    
                    <div class="title">CONSTANCIA DE EGRESO</div>
                    
                    <div class="content">
                        <p>EL QUE SUSCRIBE, SECRETARIO ACADÉMICO DEL <strong>${(institute?.name || 'INSTITUTO').toUpperCase()}</strong>, HACE CONSTAR QUE EL ESTUDIANTE:</p>
                        <p style="text-align: center; font-size: 1.3em; margin: 30px 0;"><strong>${student.fullName.toUpperCase()}</strong></p>
                        <p>IDENTIFICADO CON DOCUMENTO DE IDENTIDAD N° <strong>${student.documentId}</strong>, HA CULMINADO SATISFACTORIAMENTE EL PLAN DE ESTUDIOS CORRESPONDIENTE AL PROGRAMA DE:</p>
                        <p style="text-align: center; font-weight: bold; margin: 20px 0;">"${programName.toUpperCase()}"</p>
                        <p>HABIENDO APROBADO LA TOTALIDAD DE LAS UNIDADES DIDÁCTICAS Y CUMPLIDO CON LAS EXPERIENCIAS FORMATIVAS EN SITUACIONES REALES DE TRABAJO (EFSRT) REQUERIDAS POR LEY, SEGÚN CONSTA EN NUESTROS ARCHIVOS ACADÉMICOS.</p>
                        <p>SE EXPIDE LA PRESENTE PARA LOS FINES QUE EL INTERESADO CREA CONVENIENTE.</p>
                        <p style="text-align: right; margin-top: 50px;">Lugar y Fecha: ${today}</p>
                    </div>

                    <div class="footer">
                        <div class="signature"><p>SECRETARÍA ACADÉMICA</p></div>
                        <div class="signature"><p>DIRECCIÓN GENERAL</p></div>
                    </div>

                    <div class="no-print" style="margin-top: 50px; text-align: center;">
                        <button onclick="window.print()">IMPRIMIR AHORA</button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (loading && activeTab === 'verificacion') return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <GraduationCap className="h-24 w-24" />
                </div>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Award className="h-8 w-8 text-accent" />
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">Consolidado de Egreso y Graduación</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-lg">Control oficial de egresados y auditoría de requisitos académicos.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-14 bg-muted/50 p-1">
                    <TabsTrigger value="verificacion" className="text-base font-bold data-[state=active]:bg-background data-[state=active]:text-primary">
                        <ListChecks className="mr-2 h-5 w-5" /> Verificación de Candidatos
                    </TabsTrigger>
                    <TabsTrigger value="padron" className="text-base font-bold data-[state=active]:bg-background data-[state=active]:text-primary">
                        <Archive className="mr-2 h-5 w-5" /> Padrón Oficial de Egresados
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Verificación (Candidatos) */}
                <TabsContent value="verificacion" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Auditoría en Tiempo Real</CardTitle>
                            <CardDescription>El sistema valida automáticamente que el alumno tenga el 100% de cursos aprobados y prácticas culminadas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>Estudiante</TableHead>
                                            <TableHead>Carrera</TableHead>
                                            <TableHead className="text-center">Unidades Pend.</TableHead>
                                            <TableHead className="text-center">EFSRT Pend.</TableHead>
                                            <TableHead className="text-center">Elegibilidad</TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.length > 0 ? students.map(student => {
                                            const result = eligibilityMap[student.documentId];
                                            const programName = programs.find(p => p.id === student.programId)?.name || 'N/A';
                                            
                                            return (
                                                <TableRow key={student.documentId}>
                                                    <TableCell>
                                                        <div className="flex flex-col leading-tight">
                                                            <span className="font-bold text-sm uppercase">{student.fullName}</span>
                                                            <span className="text-[10px] font-mono text-muted-foreground">{student.documentId}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium">{programName}</TableCell>
                                                    <TableCell className="text-center">
                                                        {result?.pendingUnits.length > 0 ? (
                                                            <Badge variant="destructive" className="text-[10px] font-black">{result.pendingUnits.length}</Badge>
                                                        ) : <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {result?.pendingEFSRT.length > 0 ? (
                                                            <Badge variant="destructive" className="text-[10px] font-black">{result.pendingEFSRT.length}</Badge>
                                                        ) : <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {result?.eligible ? (
                                                            <Badge className="bg-green-100 text-green-800 border-green-200 animate-pulse font-black px-3">EXPEDITO</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px] opacity-60">EN PROCESO</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {result?.eligible ? (
                                                            <Button size="sm" onClick={() => { setSelectedStudent(student); setIsPromoteDialogOpen(true); }}>
                                                                <UserCheck className="mr-2 h-4 w-4" /> Egresar Estudiante
                                                            </Button>
                                                        ) : (
                                                            <Button variant="ghost" size="icon" onClick={() => {
                                                                const details = [
                                                                    result?.pendingUnits.length > 0 ? `CURSOS DEBIENDO (${result.pendingUnits.length}):\n- ${result.pendingUnits.join('\n- ')}` : '✓ Todos los cursos aprobados.',
                                                                    result?.pendingEFSRT.length > 0 ? `PRÁCTICAS PENDIENTES:\n- ${result.pendingEFSRT.join('\n- ')}` : '✓ Todas las prácticas culminadas.'
                                                                ].join('\n\n');
                                                                toast({ title: "Auditoría de Requisitos", description: details, duration: 10000 });
                                                            }}>
                                                                <Info className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">No hay estudiantes activos pendientes de egreso.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
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
                                            {Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                                                <SelectItem key={y} value={y}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Programa de Estudios</Label>
                                    <Select value={registryProgram} onValueChange={setRegistryProgram}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas las Carreras</SelectItem>
                                            {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                    <Button variant="outline" className="w-full" onClick={fetchRegistryData}>
                                        <Search className="mr-2 h-4 w-4" /> Aplicar Filtros
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="w-[50px]">N°</TableHead>
                                            <TableHead>Egresado</TableHead>
                                            <TableHead>Carrera</TableHead>
                                            <TableHead className="text-center">Año Egreso</TableHead>
                                            <TableHead className="text-right">Opciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingRegistry ? (
                                            <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6" /></TableCell></TableRow>
                                        ) : graduates.length > 0 ? graduates.map((egresado, idx) => (
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
                                        )) : (
                                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No se encontraron egresados con los filtros seleccionados.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" /> Confirmar Egreso</DialogTitle>
                        <DialogDescription>
                            El estudiante <strong>{selectedStudent?.fullName}</strong> ha cumplido con el 100% de sus créditos y prácticas. Al confirmar, su estado cambiará a "Egresado".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Año de Graduación / Promoción</Label>
                            <Input 
                                value={graduationYear} 
                                onChange={(e) => setGraduationYear(e.target.value)} 
                                placeholder="Ej: 2024"
                            />
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-md flex gap-3 text-xs text-amber-800">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p>Esta acción es oficial. El usuario dejará de aparecer en las listas de matrícula activa y pasará al padrón de egresados del instituto.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPromoteDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handlePromote} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Egreso Oficial
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}