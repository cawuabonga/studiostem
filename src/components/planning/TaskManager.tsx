
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWeekData, deleteTaskFromWeek, getTaskSubmissions, submitTask, gradeTaskSubmission, getStudentProfile, getEnrolledStudentProfiles } from '@/config/firebase';
import type { Task, Unit, TaskSubmission, StudentProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { FileText, CalendarClock, PlusCircle, MoreVertical, MoreHorizontal, Edit, Trash2, Send, CheckCircle2, User, Loader2, Download, Star, Info, Link as LinkIcon, ExternalLink, Paperclip, ClipboardCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { AddTaskForm } from './AddTaskForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from '../ui/button';
import { Timestamp } from 'firebase/firestore';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface TaskManagerProps {
  unit: Unit;
  weekNumber: number;
  isStudentView: boolean;
  onDataChanged: () => void;
}

interface StudentWithSubmission extends StudentProfile {
    submission: TaskSubmission | null;
}

export function TaskManager({ unit, weekNumber, isStudentView, onDataChanged }: TaskManagerProps) {
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
      const weekData = await getWeekData(instituteId, unit.id, weekNumber);
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
    } finally { setLoading(false); }
  }, [instituteId, unit.id, weekNumber, isStudentView, user?.documentId, toast]);

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
          const currentYear = new Date().getFullYear().toString();
          const [allEnrolled, taskSubs] = await Promise.all([
              getEnrolledStudentProfiles(instituteId, unit.id, currentYear, unit.period),
              getTaskSubmissions(instituteId, unit.id, weekNumber, task.id)
          ]);

          // Merge and sort
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
          await gradeTaskSubmission(
              instituteId, 
              unit.id, 
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
          
          // Local update to avoid full refetch
          setStudentsWithSubmissions(prev => prev.map(s => {
              if (s.documentId === gradingData.studentId) {
                  return {
                      ...s,
                      submission: {
                          ...(s.submission || { id: s.documentId, studentName: s.fullName, submittedAt: Timestamp.now() }),
                          grade: Number(gradingData.grade),
                          feedback: gradingData.feedback
                      }
                  }
              }
              return s;
          }));
          
          setGradingData({ studentId: '', studentName: '', grade: '', feedback: '' });
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
    <Card className="bg-muted/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Tareas</CardTitle>
            {!isStudentView && <Button variant="outline" size="sm" onClick={() => { setEditingTask(null); setIsFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Tarea</Button>}
        </CardHeader>
        <CardContent className="space-y-3">
            {loading ? <Skeleton className="h-20 w-full" /> : tasks.length > 0 ? tasks.map(task => {
                const mySub = existingSubmissions[task.id];
                return (
                    <div key={task.id} className="p-3 rounded-lg border bg-background group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 overflow-hidden">
                                <h4 className="font-bold text-sm leading-tight truncate">{task.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 italic">
                                    {task.description}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge variant="outline" className="text-[10px] font-normal"><CalendarClock className="h-3 w-3 mr-1" /> Vence: {format((task.dueDate as Timestamp).toDate(), "dd/MM")}</Badge>
                                    {isStudentView && mySub && (
                                        <Badge variant={mySub.grade !== undefined ? "default" : "secondary"} className="text-[10px] animate-in fade-in">
                                            {mySub.grade !== undefined ? `Nota: ${mySub.grade}` : "Entregado"}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-2">
                                {isStudentView ? (
                                    <div className="flex flex-col gap-1">
                                        <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold uppercase" onClick={() => setSelectedTaskForInstructions(task)}>
                                            <Info className="h-3 w-3 mr-1" /> Instrucciones
                                        </Button>
                                        <Button size="sm" variant={mySub ? "outline" : "default"} onClick={() => handleOpenSubmission(task)}>
                                            {mySub ? <Edit className="h-3 w-3 mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                                            {mySub ? "Actualizar" : "Entregar"}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="secondary" onClick={() => handleOpenGrading(task)}><Star className="h-3 w-3 mr-1" /> Calificar</Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => { setEditingTask(task); setIsFormOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => deleteTaskFromWeek(instituteId!, unit.id, weekNumber, task.id).then(() => fetchTasks())}><Trash2 className="h-4 w-4 mr-2" /> Eliminar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }) : <p className="text-center text-xs text-muted-foreground py-6">No hay tareas programadas.</p>}
        </CardContent>

        {/* Dialogs */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>{editingTask ? 'Editar Tarea' : 'Añadir Tarea'}</DialogTitle></DialogHeader>
                <AddTaskForm unit={unit} weekNumber={weekNumber} initialData={editingTask} onDataChanged={() => { setIsFormOpen(false); fetchTasks(); onDataChanged(); }} onCancel={() => setIsFormOpen(false)} />
            </DialogContent>
        </Dialog>

        {/* Instructions Dialog */}
        <Dialog open={!!selectedTaskForInstructions} onOpenChange={() => setSelectedTaskForInstructions(null)}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Instrucciones de la Tarea</DialogTitle>
                    <DialogDescription className="font-bold text-primary">{selectedTaskForInstructions?.title}</DialogDescription>
                </DialogHeader>
                <div className="py-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground border-t border-b">
                    {selectedTaskForInstructions?.description}
                </div>
                <div className="flex justify-between items-center text-xs pt-2">
                    <p className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Fecha límite: {selectedTaskForInstructions?.dueDate && format((selectedTaskForInstructions.dueDate as Timestamp).toDate(), "PPP")}</p>
                </div>
                <DialogFooter>
                    <Button onClick={() => setSelectedTaskForInstructions(null)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Submission Dialog */}
        <Dialog open={!!selectedTaskForSubmission} onOpenChange={() => setSelectedTaskForSubmission(null)}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Entregar Trabajo: {selectedTaskForSubmission?.title}</DialogTitle>
                    <DialogDescription>Elige la forma en la que deseas entregar tu tarea.</DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="file" className="w-full py-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="file" className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" /> Subir Archivo
                        </TabsTrigger>
                        <TabsTrigger value="link" className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" /> Enviar Enlace
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="file" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-file">Seleccionar Archivo (PDF, Word, etc.)</Label>
                            <Input id="task-file" type="file" onChange={e => setSubmissionFile(e.target.files?.[0] || null)} />
                        </div>
                        <Button className="w-full" onClick={() => handleSubmitWork('file')} disabled={!submissionFile || isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                            Subir y Entregar
                        </Button>
                    </TabsContent>
                    
                    <TabsContent value="link" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-link">Enlace del Trabajo</Label>
                            <Input id="task-link" placeholder="https://docs.google.com/..." value={submissionLink} onChange={e => setSubmissionLink(e.target.value)} />
                        </div>
                        <Button className="w-full" onClick={() => handleSubmitWork('link')} disabled={!submissionLink || isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                            Enviar Enlace
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>

        {/* Grading Dialog */}
        <Dialog open={!!selectedTaskForGrading} onOpenChange={() => setSelectedTaskForGrading(null)}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl uppercase font-black tracking-tight">Panel de Calificación: {selectedTaskForGrading?.title}</DialogTitle>
                    <DialogDescription>Gestione las entregas y asigne notas a toda la clase.</DialogDescription>
                    
                    {/* Counters Section */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <Card className="bg-slate-50 border-slate-200">
                            <CardContent className="p-3 text-center">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Matriculados</p>
                                <p className="text-2xl font-black">{gradingStats.total}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-3 text-center">
                                <p className="text-[10px] font-black uppercase text-green-600 mb-1">Entregados</p>
                                <p className="text-2xl font-black text-green-700">{gradingStats.submitted}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="p-3 text-center">
                                <p className="text-[10px] font-black uppercase text-red-600 mb-1">Pendientes</p>
                                <p className="text-2xl font-black text-red-700">{gradingStats.pending}</p>
                            </CardContent>
                        </Card>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden px-6 pb-6">
                    {gradingLoading ? (
                        <div className="space-y-4 py-8"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
                    ) : (
                        <ScrollArea className="h-full pr-4 border rounded-xl bg-muted/20">
                            <div className="space-y-3 p-4">
                                {studentsWithSubmissions.map((item, index) => {
                                    const sub = item.submission;
                                    const isDelivered = !!sub?.submittedAt;
                                    const isEditing = gradingData.studentId === item.documentId;

                                    return (
                                        <div key={item.documentId} className={cn(
                                            "p-4 rounded-lg border bg-background transition-all flex flex-col md:flex-row justify-between gap-4",
                                            !isDelivered && "opacity-75 bg-slate-50/50 grayscale-[0.3]"
                                        )}>
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <span className="text-sm font-black text-muted-foreground w-6">{index + 1}.</span>
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="font-bold text-sm uppercase truncate">{item.lastName}, {item.firstName}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={isDelivered ? "default" : "destructive"} className="text-[9px] font-black uppercase tracking-tighter px-1.5 h-4">
                                                            {isDelivered ? <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> : <Clock className="h-2.5 w-2.5 mr-1" />}
                                                            {isDelivered ? "Entregado" : "No Entregó"}
                                                        </Badge>
                                                        {isDelivered && (
                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                {format(sub!.submittedAt.toDate(), "dd/MM HH:mm")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isDelivered && (
                                                        <div className="flex gap-2 mt-3">
                                                            {sub!.fileUrl && (
                                                                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-tight" asChild>
                                                                    <a href={sub!.fileUrl} target="_blank"><Download className="h-3 w-3 mr-1" /> Archivo</a>
                                                                </Button>
                                                            )}
                                                            {sub!.link && (
                                                                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-tight" asChild>
                                                                    <a href={sub!.link} target="_blank"><ExternalLink className="h-3 w-3 mr-1" /> Enlace</a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 shrink-0 md:items-end justify-center">
                                                {isEditing ? (
                                                    <div className="space-y-2 p-2 bg-primary/5 rounded-lg border border-primary/10 animate-in slide-in-from-right-2">
                                                        <div className="flex gap-2">
                                                            <Input 
                                                                type="number" 
                                                                placeholder="Nota" 
                                                                className="w-20 font-bold text-center h-9" 
                                                                value={gradingData.grade} 
                                                                onChange={e => setGradingData(p => ({...p, grade: e.target.value}))} 
                                                            />
                                                            <Textarea 
                                                                placeholder="Comentarios (opcional)..." 
                                                                className="h-9 text-xs min-h-0 py-1" 
                                                                value={gradingData.feedback} 
                                                                onChange={e => setGradingData(p => ({...p, feedback: e.target.value}))} 
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 justify-end">
                                                            <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase" onClick={() => setGradingData({ studentId: '', studentName: '', grade: '', feedback: '' })}>Cancelar</Button>
                                                            <Button size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={handleSaveGrade} disabled={isSubmitting}>
                                                                {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : "Guardar"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        {sub?.grade !== undefined ? (
                                                            <Badge variant="outline" className={cn(
                                                                "text-xl font-black px-3 h-10 border-2",
                                                                sub.grade < 13 ? "border-red-200 text-red-600 bg-red-50" : "border-primary/20 text-primary bg-primary/5"
                                                            )}>
                                                                {sub.grade.toString().padStart(2, '0')}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase mr-2">Sin Nota</span>
                                                        )}
                                                        <Button 
                                                            variant="secondary" 
                                                            size="sm" 
                                                            className="h-10 font-bold uppercase text-[10px]"
                                                            onClick={() => setGradingData({ 
                                                                studentId: item.documentId, 
                                                                studentName: item.fullName,
                                                                grade: sub?.grade?.toString() || '', 
                                                                feedback: sub?.feedback || '' 
                                                            })}
                                                        >
                                                            <ClipboardCheck className="h-4 w-4 mr-1.5" />
                                                            Calificar
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
                <DialogFooter className="p-4 border-t bg-muted/20">
                    <Button variant="ghost" onClick={() => setSelectedTaskForGrading(null)}>Cerrar Panel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </Card>
  );
}
