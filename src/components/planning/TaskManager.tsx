"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWeekData, deleteTaskFromWeek } from '@/services/academic-service';
import { getTaskSubmissions, submitTask, gradeTaskSubmission, getStudentProfile, getEnrolledStudentProfiles } from '@/config/firebase';
import type { Task, Unit, TaskSubmission, StudentProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { CalendarClock, PlusCircle, MoreHorizontal, Edit, Trash2, Send, CheckCircle2, User, Loader2, Download, Star, Info, Link as LinkIcon, ExternalLink, Paperclip, ClipboardCheck, Clock, XCircle, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AddTaskForm } from './AddTaskForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from '../ui/button';
import { Timestamp } from 'firebase/firestore';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface TaskManagerProps {
  unit: Unit;
  year: string;
  weekNumber: number;
  isStudentView: boolean;
  onDataChanged: () => void;
}

interface StudentWithSubmission extends StudentProfile {
    submission: TaskSubmission | null;
}

export function TaskManager({ unit, year, weekNumber, isStudentView, onDataChanged }: TaskManagerProps) {
  const { instituteId, user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskForInstructions, setSelectedTaskForInstructions] = useState<Task | null>(null);
  
  // States for student submission
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<Task | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSubmissions, setExistingSubmissions] = useState<Record<string, TaskSubmission | null>>({});

  // States for teacher grading
  const [selectedTaskForGrading, setSelectedTaskForGrading] = useState<Task | null>(null);
  const [studentsWithSubmissions, setStudentsWithSubmissions] = useState<StudentWithSubmission[]>([]);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradingData, setGradingData] = useState({ studentId: '', studentName: '', grade: '', feedback: '' });

  const fetchTasks = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const weekData = await getWeekData(instituteId, unit.id, year, unit.period, weekNumber);
      const tasksList = weekData?.tasks || [];
      setTasks(tasksList);

      if (isStudentView && user?.documentId) {
          const subs: Record<string, TaskSubmission | null> = {};
          for (const task of tasksList) {
              const allSubs = await getTaskSubmissions(instituteId, unit.id, weekNumber, task.id);
              subs[task.id] = allSubs.find(s => s.id === user.documentId) || null;
          }
          setExistingSubmissions(subs);
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las tareas.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, unit.id, unit.period, year, weekNumber, isStudentView, user?.documentId, toast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleOpenSubmission = (task: Task) => {
      setSelectedTaskForSubmission(task);
      setSubmissionFile(null);
      setSubmissionLink('');
  };

  const handleSubmitWork = async (type: 'file' | 'link') => {
    if (!instituteId || !selectedTaskForSubmission || !user?.documentId) return;
    
    if (type === 'file' && !submissionFile) {
        toast({ title: "Atención", description: "Por favor selecciona un archivo.", variant: "destructive" });
        return;
    }
    if (type === 'link' && !submissionLink.trim()) {
        toast({ title: "Atención", description: "Por favor ingresa un enlace válido.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        const studentProfile = await getStudentProfile(instituteId, user.documentId);
        if (!studentProfile) throw new Error("Perfil de estudiante no encontrado.");
        
        await submitTask(
            instituteId, 
            unit.id, 
            weekNumber, 
            selectedTaskForSubmission.id, 
            studentProfile, 
            type === 'file' ? submissionFile! : undefined,
            type === 'link' ? submissionLink : undefined
        );
        
        toast({ title: "Tarea Entregada", description: "Tu trabajo ha sido enviado correctamente." });
        setSelectedTaskForSubmission(null);
        setSubmissionFile(null);
        setSubmissionLink('');
        fetchTasks();
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleOpenGrading = async (task: Task) => {
      if (!instituteId) return;
      setSelectedTaskForGrading(task);
      setGradingLoading(true);
      try {
          const currentYear = year || new Date().getFullYear().toString();
          const [allEnrolled, taskSubs] = await Promise.all([
              getEnrolledStudentProfiles(instituteId, unit.id, currentYear, unit.period),
              getTaskSubmissions(instituteId, unit.id, weekNumber, task.id)
          ]);

          const merged: StudentWithSubmission[] = allEnrolled
            .sort((a, b) => a.lastName.localeCompare(b.lastName, 'es') || a.firstName.localeCompare(b.firstName, 'es'))
            .map(student => ({
                ...student,
                submission: taskSubs.find(s => s.id === student.documentId) || null
            }));

          setStudentsWithSubmissions(merged);
      } catch (error) {
          toast({ title: "Error", description: "No se pudo cargar la lista de estudiantes.", variant: "destructive" });
      } finally {
          setGradingLoading(false);
      }
  };

  const handleSaveGrade = async () => {
      if (!instituteId || !selectedTaskForGrading || !gradingData.studentId) return;
      setIsSubmitting(true);
      try {
          const currentYear = year || new Date().getFullYear().toString();
          await gradeTaskSubmission(
              instituteId, 
              unit.id, 
              currentYear,
              unit.period,
              weekNumber, 
              selectedTaskForGrading.id, 
              selectedTaskForGrading.title,
              gradingData.studentId, 
              gradingData.studentName,
              Number(gradingData.grade), 
              gradingData.feedback
          );
          toast({ title: "Nota Guardada" });
          
          setGradingData({ studentId: '', studentName: '', grade: '', feedback: '' });
          await handleOpenGrading(selectedTaskForGrading);
      } catch (error) {
          toast({ title: "Error", variant: "destructive" });
      } finally { setIsSubmitting(false); }
  };

  const gradingStats = useMemo(() => {
    const total = studentsWithSubmissions.length;
    const submitted = studentsWithSubmissions.filter(s => !!s.submission?.submittedAt).length;
    return { total, submitted, pending: total - submitted };
  }, [studentsWithSubmissions]);

  return (
    <Card className="bg-muted/30 border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">Tareas y Actividades</CardTitle>
            </div>
            {!isStudentView && (
                <Button variant="outline" size="sm" onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="font-bold border-primary/20">
                    <PlusCircle className="mr-2 h-4 w-4" /> Nueva Tarea
                </Button>
            )}
        </CardHeader>
        <CardContent className="space-y-4 px-0">
            {loading ? (
                <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                </div>
            ) : tasks.length > 0 ? (
                tasks.map(task => {
                    const mySub = existingSubmissions[task.id];
                    const dueDate = (task.dueDate as Timestamp).toDate();
                    const isOverdue = new Date() > dueDate;

                    return (
                        <div key={task.id} className={cn(
                            "p-4 rounded-xl border bg-card transition-all flex flex-col sm:flex-row justify-between gap-4 shadow-sm group hover:border-primary/40",
                            isOverdue && !mySub && "bg-slate-50/50"
                        )}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={cn("font-black text-sm uppercase tracking-tight truncate", isOverdue && !mySub && "text-muted-foreground")}>
                                        {task.title}
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                                    {task.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] font-bold h-6 px-2", 
                                        isOverdue && !mySub ? "text-destructive border-destructive bg-destructive/5" : "text-muted-foreground"
                                    )}>
                                        <CalendarClock className="h-3 w-3 mr-1.5" /> 
                                        LÍMITE: {format(dueDate, "dd/MM HH:mm")}
                                    </Badge>
                                    
                                    {isStudentView && mySub && (
                                        <Badge variant={mySub.grade !== undefined ? "default" : "secondary"} className="text-[10px] font-black h-6 px-2">
                                            {mySub.grade !== undefined ? `CALIFICACIÓN: ${mySub.grade.toString().padStart(2, '0')}` : "TRABAJO ENTREGADO"}
                                        </Badge>
                                    )}
                                    
                                    {isStudentView && isOverdue && !mySub && (
                                        <Badge variant="destructive" className="text-[10px] font-black animate-pulse h-6 px-2 uppercase tracking-tighter">
                                            <XCircle className="h-3 w-3 mr-1" /> Plazo Vencido
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex sm:flex-col gap-2 shrink-0 justify-end sm:justify-center border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4">
                                {isStudentView ? (
                                    <>
                                        <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase tracking-tight flex-1 sm:flex-none" onClick={() => setSelectedTaskForInstructions(task)}>
                                            <Info className="h-3.5 w-3.5 mr-1.5" /> Instrucciones
                                        </Button>
                                        {!mySub ? (
                                            <Button 
                                                size="sm" 
                                                className="h-8 text-[10px] font-black uppercase tracking-widest flex-1 sm:flex-none shadow-sm"
                                                variant={isOverdue ? "secondary" : "default"} 
                                                onClick={() => handleOpenSubmission(task)}
                                                disabled={isOverdue}
                                            >
                                                {isOverdue ? "CERRADO" : "ENTREGAR"}
                                            </Button>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-8 text-[10px] font-black uppercase tracking-widest flex-1 sm:flex-none border-2"
                                                onClick={() => handleOpenSubmission(task)}
                                                disabled={isOverdue}
                                            >
                                                {isOverdue ? "ENVIADO" : "ACTUALIZAR"}
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <Button size="sm" variant="secondary" className="h-8 text-[10px] font-bold uppercase" onClick={() => handleOpenGrading(task)}>
                                            <Star className="h-3.5 w-3.5 mr-1.5 text-primary" /> Calificar
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => { setEditingTask(task); setIsFormOpen(true); }} className="font-medium">
                                                    <Edit className="h-4 w-4 mr-2" /> Editar Tarea
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive font-medium" onClick={() => deleteTaskFromWeek(instituteId!, unit.id, year, unit.period, weekNumber, task.id).then(() => fetchTasks())}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })
            ) : (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-background/50">
                    <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Sin tareas programadas</p>
                </div>
            )}
        </CardContent>

        {/* Modal: Crear/Editar Tarea */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase text-primary">{editingTask ? 'Editar Tarea Oficial' : 'Programar Nueva Tarea'}</DialogTitle>
                    <DialogDescription>Defina los plazos y requisitos para la actividad de los alumnos.</DialogDescription>
                </DialogHeader>
                <AddTaskForm 
                    unit={unit} 
                    weekNumber={weekNumber} 
                    initialData={editingTask} 
                    onDataChanged={() => { setIsFormOpen(false); fetchTasks(); onDataChanged(); }} 
                    onCancel={() => setIsFormOpen(false)} 
                />
            </DialogContent>
        </Dialog>

        {/* Modal: Instrucciones del Estudiante */}
        <Dialog open={!!selectedTaskForInstructions} onOpenChange={(open) => !open && setSelectedTaskForInstructions(null)}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
                <div className="bg-primary p-6 text-primary-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight leading-none mb-2">
                            {selectedTaskForInstructions?.title}
                        </DialogTitle>
                        <div className="flex items-center gap-2 opacity-80 text-xs font-bold uppercase tracking-widest">
                            <Clock className="h-3.5 w-3.5" />
                            VENCE: {selectedTaskForInstructions?.dueDate ? format((selectedTaskForInstructions.dueDate as Timestamp).toDate(), "PPPP 'a las' HH:mm", { locale: es }) : '---'}
                        </div>
                    </DialogHeader>
                </div>
                
                <div className="p-8 space-y-8">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" /> Instrucciones del Docente
                        </h4>
                        <div className="p-5 bg-muted/30 rounded-xl border-2 border-dashed text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedTaskForInstructions?.description}
                        </div>
                    </div>

                    {(selectedTaskForInstructions?.fileUrl || selectedTaskForInstructions?.referenceLink) && (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                                <Paperclip className="h-4 w-4 text-primary" /> Recursos de Apoyo
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedTaskForInstructions?.fileUrl && (
                                    <Button variant="outline" className="justify-start h-auto p-4 bg-blue-50/50 border-blue-100 hover:bg-blue-50 border-2 rounded-xl group transition-all" asChild>
                                        <a href={selectedTaskForInstructions.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <Download className="mr-3 h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                                            <div className="text-left overflow-hidden">
                                                <p className="text-xs font-black text-blue-800 uppercase leading-none">Guía de Actividad</p>
                                                <p className="text-[10px] text-blue-500 truncate mt-1">Descargar archivo PDF/Word</p>
                                            </div>
                                        </a>
                                    </Button>
                                )}
                                {selectedTaskForInstructions?.referenceLink && (
                                    <Button variant="outline" className="justify-start h-auto p-4 bg-green-50/50 border-green-100 hover:bg-green-50 border-2 rounded-xl group transition-all" asChild>
                                        <a href={selectedTaskForInstructions.referenceLink} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-3 h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                                            <div className="text-left overflow-hidden">
                                                <p className="text-xs font-black text-green-800 uppercase leading-none">Material Externo</p>
                                                <p className="text-[10px] text-green-500 truncate mt-1">Visitar enlace de referencia</p>
                                            </div>
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setSelectedTaskForInstructions(null)} className="font-bold">CERRAR</Button>
                    {selectedTaskForInstructions && !(new Date() > (selectedTaskForInstructions.dueDate as Timestamp).toDate()) && (
                        <Button className="font-black px-8" onClick={() => { 
                            const task = selectedTaskForInstructions; 
                            setSelectedTaskForInstructions(null); 
                            handleOpenSubmission(task!); 
                        }}>
                            IR A ENTREGAR
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        {/* Modal: Entrega de Estudiante */}
        <Dialog open={!!selectedTaskForSubmission} onOpenChange={(open) => !open && setSelectedTaskForSubmission(null)}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase text-primary">Entregar Mi Trabajo</DialogTitle>
                    <DialogDescription>Actividad: <span className="font-bold text-foreground">{selectedTaskForSubmission?.title}</span></DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="file" className="w-full py-4">
                    <TabsList className="grid w-full grid-cols-2 h-12 bg-muted p-1">
                        <TabsTrigger value="file" className="flex items-center gap-2 font-black text-xs uppercase"><Paperclip className="h-4 w-4" /> Subir Archivo</TabsTrigger>
                        <TabsTrigger value="link" className="flex items-center gap-2 font-black text-xs uppercase"><LinkIcon className="h-4 w-4" /> Pegar Enlace</TabsTrigger>
                    </TabsList>
                    <TabsContent value="file" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-file" className="text-xs font-bold uppercase text-muted-foreground">Archivo del Trabajo (PDF, ZIP, etc.)</Label>
                            <Input id="task-file" type="file" onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)} disabled={isSubmitting} className="h-12" />
                            <p className="text-[10px] text-muted-foreground italic">Se recomienda subir archivos PDF para facilitar la revisión del docente.</p>
                        </div>
                        <Button className="w-full h-12 font-black uppercase tracking-widest shadow-xl" onClick={() => handleSubmitWork('file')} disabled={!submissionFile || isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            ENVIAR TRABAJO OFICIAL
                        </Button>
                    </TabsContent>
                    <TabsContent value="link" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-link" className="text-xs font-bold uppercase text-muted-foreground">Enlace de Entrega (Drive, GitHub, etc.)</Label>
                            <Input id="task-link" placeholder="https://..." value={submissionLink} onChange={(e) => setSubmissionLink(e.target.value)} disabled={isSubmitting} className="h-12 font-mono" />
                            <p className="text-[10px] text-muted-foreground italic">Asegúrese de que el enlace tenga los permisos de lectura configurados correctamente.</p>
                        </div>
                        <Button className="w-full h-12 font-black uppercase tracking-widest shadow-xl" onClick={() => handleSubmitWork('link')} disabled={!submissionLink || isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            ENVIAR ENLACE OFICIAL
                        </Button>
                    </TabsContent>
                </Tabs>
                <DialogFooter className="border-t pt-4"><Button variant="ghost" onClick={() => setSelectedTaskForSubmission(null)} className="font-bold">CANCELAR</Button></DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Modal: Panel de Calificación (Docente) */}
        <Dialog open={!!selectedTaskForGrading} onOpenChange={(open) => !open && setSelectedTaskForGrading(null)}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
                <DialogHeader className="p-8 pb-4 shrink-0 border-b bg-background">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Star className="h-6 w-6 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl uppercase font-black tracking-tight">Centro de Evaluación: {selectedTaskForGrading?.title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-base">Gestione las entregas recibidas y asigne notas a los alumnos matriculados.</DialogDescription>
                    
                    <div className="grid grid-cols-3 gap-6 mt-6">
                        <div className="bg-slate-50 border rounded-2xl p-4 flex flex-col items-center">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Matriculados</p>
                            <p className="text-3xl font-black">{gradingStats.total}</p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex flex-col items-center">
                            <p className="text-[10px] font-black uppercase text-green-600 mb-1 tracking-widest">Entregados</p>
                            <p className="text-3xl font-black text-green-700">{gradingStats.submitted}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center">
                            <p className="text-[10px] font-black uppercase text-amber-600 mb-1 tracking-widest">Pendientes</p>
                            <p className="text-3xl font-black text-amber-700">{gradingStats.pending}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-8 py-6">
                    {gradingLoading ? (
                        <div className="space-y-4 py-8"><Skeleton className="h-20 w-full rounded-2xl" /><Skeleton className="h-20 w-full rounded-2xl" /><Skeleton className="h-20 w-full rounded-2xl" /></div>
                    ) : (
                        <ScrollArea className="flex-1 h-full rounded-2xl border bg-muted/10 shadow-inner">
                            <div className="space-y-4 p-6">
                                {studentsWithSubmissions.map((item, index) => {
                                    const sub = item.submission;
                                    const isDelivered = !!sub?.submittedAt;
                                    const isEditing = gradingData.studentId === item.documentId;

                                    return (
                                        <div key={item.documentId} className={cn(
                                            "p-5 rounded-2xl border bg-background transition-all flex flex-col lg:flex-row justify-between gap-6 shadow-sm hover:shadow-md",
                                            !isDelivered && "bg-slate-50/50 opacity-80"
                                        )}>
                                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                                <span className="text-sm font-black text-muted-foreground w-6 text-center">{index + 1}.</span>
                                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border-2 border-primary/5">
                                                    <User className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="font-black text-sm uppercase truncate text-slate-800">{item.lastName}, {item.firstName}</p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <Badge variant={isDelivered ? "default" : "destructive"} className="text-[9px] font-black uppercase tracking-tighter px-2 h-5">
                                                            {isDelivered ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                                            {isDelivered ? "Entregado" : "Pendiente"}
                                                        </Badge>
                                                        {isDelivered && (
                                                            <span className="text-[10px] text-muted-foreground font-mono font-bold">
                                                                {format(sub!.submittedAt.toDate(), "dd/MM HH:mm")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isDelivered && (
                                                        <div className="flex gap-2 mt-4">
                                                            {sub!.fileUrl && (
                                                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight rounded-lg border-primary/10 hover:bg-primary/5" asChild>
                                                                    <a href={sub!.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-3.5 w-3.5 mr-2 text-primary" /> Abrir Archivo</a>
                                                                </Button>
                                                            )}
                                                            {sub!.link && (
                                                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight rounded-lg border-primary/10 hover:bg-primary/5" asChild>
                                                                    <a href={sub!.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-2 text-primary" /> Ver Enlace</a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 shrink-0 lg:items-end justify-center">
                                                {isEditing ? (
                                                    <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border-2 border-primary/10 animate-in zoom-in-95 duration-200 w-full lg:w-[350px]">
                                                        <div className="flex gap-3">
                                                            <div className="w-[80px] space-y-1.5">
                                                                <Label className="text-[9px] uppercase font-black tracking-widest text-primary">Nota (0-20)</Label>
                                                                <Input 
                                                                    type="number" 
                                                                    className="font-black text-center h-10 text-lg border-primary/20 focus-visible:ring-primary" 
                                                                    value={gradingData.grade} 
                                                                    onChange={e => setGradingData(p => ({...p, grade: e.target.value}))} 
                                                                />
                                                            </div>
                                                            <div className="flex-1 space-y-1.5">
                                                                <Label className="text-[9px] uppercase font-black tracking-widest text-primary">Feedback</Label>
                                                                <Input 
                                                                    placeholder="Comentarios del docente..." 
                                                                    className="h-10 text-xs border-primary/10" 
                                                                    value={gradingData.feedback} 
                                                                    onChange={e => setGradingData(p => ({...p, feedback: e.target.value}))} 
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 justify-end pt-1">
                                                            <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase" onClick={() => setGradingData({ studentId: '', studentName: '', grade: '', feedback: '' })}>Cancelar</Button>
                                                            <Button size="sm" className="h-8 text-[10px] font-black uppercase px-6" onClick={handleSaveGrade} disabled={isSubmitting}>
                                                                {isSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : "Guardar Nota"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4">
                                                        {sub?.grade !== undefined ? (
                                                            <div className="text-right mr-3">
                                                                <p className="text-[8px] font-black uppercase text-muted-foreground leading-none mb-1 tracking-widest">Puntaje</p>
                                                                <Badge variant="outline" className={cn(
                                                                    "text-2xl font-black px-4 h-12 border-2 rounded-xl",
                                                                    sub.grade < 13 ? "border-red-200 text-red-600 bg-red-50" : "border-primary/20 text-primary bg-primary/5"
                                                                )}>
                                                                    {sub.grade.toString().padStart(2, '0')}
                                                                </Badge>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-muted-foreground uppercase mr-4 tracking-tighter opacity-40">Sin Evaluar</span>
                                                        )}
                                                        <Button 
                                                            variant="secondary" 
                                                            className="h-12 font-black uppercase text-[10px] px-6 rounded-xl border border-primary/5 hover:bg-primary/5 hover:text-primary transition-all"
                                                            onClick={() => setGradingData({ 
                                                                studentId: item.documentId, 
                                                                studentName: item.fullName,
                                                                grade: sub?.grade?.toString() || '', 
                                                                feedback: sub?.feedback || '' 
                                                            })}
                                                        >
                                                            <ClipboardCheck className="h-4 w-4 mr-2" />
                                                            {sub?.grade !== undefined ? "Recalificar" : "Calificar Ahora"}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>
                <DialogFooter className="p-6 border-t bg-muted/20 shrink-0">
                    <Button variant="ghost" onClick={() => setSelectedTaskForGrading(null)} className="font-black uppercase tracking-widest">Finalizar Sesión de Calificación</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </Card>
  );
}
