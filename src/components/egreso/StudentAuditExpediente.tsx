
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { StudentProfile, Unit, Matriculation, EFSRTAssignment, Payment, StudentEgresoAudit, Program, UnitPeriod } from '@/types';
import { getStudentProfile, getUnits, getMatriculationsForStudent, getAllEFSRTAssignments, getStudentPaymentsByStatus, checkEgresoEligibility, registerHistoricalMatriculation, registerHistoricalEFSRT } from '@/config/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, GraduationCap, BookOpen, Briefcase, CreditCard, Info, NotebookPen, PlusCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';

interface StudentAuditExpedienteProps {
    studentId: string;
    instituteId: string;
    program: Program;
}

export function StudentAuditExpediente({ studentId, instituteId, program }: StudentAuditExpedienteProps) {
    const { toast } = useToast();
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [audit, setAudit] = useState<StudentEgresoAudit | null>(null);
    const [matriculations, setMatriculations] = useState<Matriculation[]>([]);
    const [efsrt, setEfsrt] = useState<EFSRTAssignment[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states for regularization
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedUnitForGrade, setSelectedUnitForManualGrade] = useState<Unit | null>(null);
    const [manualGrade, setManualGrade] = useState({ grade: '', year: new Date().getFullYear().toString(), period: 'MAR-JUL' as UnitPeriod });

    const [isEFSRTModalOpen, setIsEFSRTModalOpen] = useState(false);
    const [selectedModuleForEFSRT, setSelectedModuleForEFSRT] = useState<{name: string, code: string} | null>(null);
    const [manualEFSRT, setManualEFSRT] = useState({ location: '', grade: '', startDate: '', endDate: '' });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleRegisterHistoricalGrade = async () => {
        if (!selectedUnitForGrade || !manualGrade.grade || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await registerHistoricalMatriculation(instituteId, studentId, selectedUnitForGrade, {
                grade: Number(manualGrade.grade),
                year: manualGrade.year,
                period: manualGrade.period
            });
            toast({ title: "Nota Registrada", description: `Se ha regularizado el curso ${selectedUnitForGrade.name}.` });
            setIsGradeModalOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterHistoricalEFSRT = async () => {
        if (!selectedModuleForEFSRT || !student || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await registerHistoricalEFSRT(instituteId, {
                studentId: student.documentId,
                studentName: student.fullName,
                programId: student.programId,
                moduleId: selectedModuleForEFSRT.code,
                moduleName: selectedModuleForEFSRT.name,
                location: manualEFSRT.location,
                grade: Number(manualEFSRT.grade),
                startDate: Timestamp.fromDate(new Date(manualEFSRT.startDate)),
                endDate: Timestamp.fromDate(new Date(manualEFSRT.endDate)),
                supervisorId: 'S/N',
                supervisorName: 'Regularización Histórica'
            });
            toast({ title: "EFSRT Validada", description: "Se ha registrado la práctica profesional." });
            setIsEFSRTModalOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

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
                                            <TableHead className="text-right">Acción</TableHead>
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
                                                    <TableCell className="text-right">
                                                        {!isApproved && (
                                                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-primary" onClick={() => { setSelectedUnitForManualGrade(unit); setIsGradeModalOpen(true); }}>
                                                                <NotebookPen className="h-3 w-3 mr-1" /> REGISTRAR NOTA
                                                            </Button>
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
                                            <div className="flex items-center gap-3">
                                                {ass?.status === 'Aprobado' ? (
                                                    <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" /> COMPLETADO</Badge>
                                                ) : (
                                                    <>
                                                        <Badge variant="outline" className="text-destructive border-destructive">FALTA REGISTRO</Badge>
                                                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold" onClick={() => { setSelectedModuleForEFSRT(mod); setIsEFSRTModalOpen(true); }}>
                                                            <PlusCircle className="h-3 w-3 mr-1" /> VALIDAR HISTÓRICA
                                                        </Button>
                                                    </>
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

            {/* Modal: Registrar Nota Histórica */}
            <Dialog open={isGradeModalOpen} onOpenChange={setIsGradeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regularización de Notas: {selectedUnitForGrade?.name}</DialogTitle>
                        <DialogDescription>Use esta opción para alumnos antiguos con notas de actas físicas.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Año Académico</Label>
                            <Input placeholder="Ej: 2022" value={manualGrade.year} onChange={e => setManualGrade({...manualGrade, year: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Periodo</Label>
                            <Select value={manualGrade.period} onValueChange={(v: UnitPeriod) => setManualGrade({...manualGrade, period: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MAR-JUL">MAR-JUL</SelectItem>
                                    <SelectItem value="AGO-DIC">AGO-DIC</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Nota Final (0 - 20)</Label>
                            <Input type="number" placeholder="Ej: 15" value={manualGrade.grade} onChange={e => setManualGrade({...manualGrade, grade: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsGradeModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleRegisterHistoricalGrade} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar Nota de Acta"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Validar EFSRT Histórica */}
            <Dialog open={isEFSRTModalOpen} onOpenChange={setIsEFSRTModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Validación de Práctica: {selectedModuleForEFSRT?.name}</DialogTitle>
                        <DialogDescription>Registre los detalles de la práctica profesional realizada.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Empresa / Institución</Label>
                            <Input placeholder="Nombre de la empresa" value={manualEFSRT.location} onChange={e => setManualEFSRT({...manualEFSRT, location: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Fecha Inicio</Label><Input type="date" value={manualEFSRT.startDate} onChange={e => setManualEFSRT({...manualEFSRT, startDate: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Fecha Fin</Label><Input type="date" value={manualEFSRT.endDate} onChange={e => setManualEFSRT({...manualEFSRT, endDate: e.target.value})} /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nota Final</Label>
                            <Input type="number" placeholder="0-20" value={manualEFSRT.grade} onChange={e => setManualEFSRT({...manualEFSRT, grade: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEFSRTModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleRegisterHistoricalEFSRT} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirmar Validación"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
