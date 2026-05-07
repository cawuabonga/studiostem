
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { StudentProfile, Unit, Matriculation, EFSRTAssignment, Payment, StudentEgresoAudit, Program } from '@/types';
import { getStudentProfile, getUnits, getMatriculationsForStudent, getAllEFSRTAssignments, getStudentPaymentsByStatus, checkEgresoEligibility } from '@/config/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, GraduationCap, BookOpen, Briefcase, CreditCard, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface StudentAuditExpedienteProps {
    studentId: string;
    instituteId: string;
    program: Program;
}

export function StudentAuditExpediente({ studentId, instituteId, program }: StudentAuditExpedienteProps) {
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [audit, setAudit] = useState<StudentEgresoAudit | null>(null);
    const [matriculations, setMatriculations] = useState<Matriculation[]>([]);
    const [efsrt, setEfsrt] = useState<EFSRTAssignment[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                profile,
                auditData,
                history,
                efsrtData,
                approvedPayments,
                allProgramUnits
            ] = await Promise.all([
                getStudentProfile(instituteId, studentId),
                checkEgresoEligibility(instituteId, studentId),
                getMatriculationsForStudent(instituteId, studentId),
                getAllEFSRTAssignments(instituteId),
                getStudentPaymentsByStatus(instituteId, studentId, 'Aprobado'),
                getUnits(instituteId)
            ]);

            setStudent(profile);
            setAudit(auditData);
            setMatriculations(history);
            setEfsrt(efsrtData.filter(a => a.studentId === studentId));
            setPayments(approvedPayments);
            setUnits(allProgramUnits.filter(u => u.programId === profile?.programId));

        } catch (error) {
            console.error("Error auditando estudiante:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId, studentId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const academicProgress = useMemo(() => {
        if (!units.length) return 0;
        const approvedCount = matriculations.filter(m => m.status === 'aprobado').length;
        return Math.round((approvedCount / units.length) * 100);
    }, [units, matriculations]);

    if (loading) return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;
    if (!student) return <p>No se encontró el expediente del estudiante.</p>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                <div>
                    <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">{student.fullName}</h2>
                    <p className="text-sm font-mono text-muted-foreground">ID: {student.documentId} | {program.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase font-bold text-muted-foreground">Progreso Académico</p>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-primary">{academicProgress}%</span>
                        {audit?.eligible ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 uppercase font-black px-4">EXPEDITO</Badge>
                        ) : (
                            <Badge variant="secondary" className="uppercase font-black px-4">EN PROCESO</Badge>
                        )}
                    </div>
                </div>
            </div>

            <Tabs defaultValue="academico">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="academico"><BookOpen className="mr-2 h-4 w-4" /> Académico</TabsTrigger>
                    <TabsTrigger value="practicas"><Briefcase className="mr-2 h-4 w-4" /> EFSRT</TabsTrigger>
                    <TabsTrigger value="administrativo"><CreditCard className="mr-2 h-4 w-4" /> Pagos</TabsTrigger>
                </TabsList>

                <TabsContent value="academico" className="pt-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Auditoría de Unidades Didácticas</CardTitle>
                            <CardDescription>Resumen de cursos por ciclo y estado de aprobación.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border max-h-[400px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[50px]">Ciclo</TableHead>
                                            <TableHead>Unidad Didáctica</TableHead>
                                            <TableHead className="text-center">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {units.sort((a,b) => a.semester - b.semester || a.name.localeCompare(b.name)).map(unit => {
                                            const m = matriculations.find(mat => mat.unitId === unit.id);
                                            const isApproved = m?.status === 'aprobado';
                                            return (
                                                <TableRow key={unit.id}>
                                                    <TableCell className="text-center font-bold">{unit.semester}</TableCell>
                                                    <TableCell>
                                                        <p className="text-xs font-bold uppercase">{unit.name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-mono">{unit.code}</p>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {isApproved ? (
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" /> APROBADO</Badge>
                                                        ) : m ? (
                                                            <Badge variant="outline" className="text-blue-600 border-blue-200"><Clock className="h-3 w-3 mr-1" /> CURSANDO</Badge>
                                                        ) : (
                                                            <Badge variant="ghost" className="text-muted-foreground"><XCircle className="h-3 w-3 mr-1" /> PENDIENTE</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="practicas" className="pt-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Experiencias Formativas (EFSRT)</CardTitle>
                            <CardDescription>Verificación de prácticas pre-profesionales por módulo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {program.modules.map(mod => {
                                    const ass = efsrt.find(a => a.moduleId === mod.code);
                                    return (
                                        <div key={mod.code} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{mod.code}</p>
                                                <h4 className="font-bold text-sm">{mod.name}</h4>
                                                {ass && <p className="text-xs text-primary mt-1">Sede: {ass.location}</p>}
                                            </div>
                                            <div className="text-right">
                                                {ass?.status === 'Aprobado' ? (
                                                    <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" /> COMPLETADO</Badge>
                                                ) : ass ? (
                                                    <Badge variant="secondary">{ass.status}</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-destructive border-destructive">FALTA REGISTRO</Badge>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="administrativo" className="pt-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Situación de Pagos</CardTitle>
                            <CardDescription>Resumen de recaudación vinculada al expediente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Concepto</TableHead>
                                            <TableHead>N° Recibo</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.length > 0 ? payments.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell className="text-xs">{format(p.paymentDate.toDate(), 'dd/MM/yy')}</TableCell>
                                                <TableCell className="font-bold text-xs uppercase">{p.concept}</TableCell>
                                                <TableCell className="font-mono text-xs">{p.receiptNumber || 'S/N'}</TableCell>
                                                <TableCell className="text-right font-black">S/ {p.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">No se encontraron pagos validados.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
