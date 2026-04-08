"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWeekData, deleteTaskFromWeek, getTaskSubmissions, submitTask, gradeTaskSubmission, getStudentProfile } from '@/config/firebase';
import type { Task, Unit, TaskSubmission } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { FileText, CalendarClock, PlusCircle, MoreVertical, MoreHorizontal, Edit, Trash2, Send, CheckCircle2, User, Loader2, Download, Star } from 'lucide-react';
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

interface TaskManagerProps {
  unit: Unit;
  weekNumber: number;
  isStudentView: boolean;
  onDataChanged: () => void;
}

export function TaskManager({ unit, weekNumber, isStudentView, onDataChanged }: TaskManagerProps) {
  const { instituteId, user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // States for student submission
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<Task | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSubmissions, setExistingSubmissions] = useState<Record<string, TaskSubmission | null>>({});

  // States for teacher grading
  const [selectedTaskForGrading, setSelectedTaskForGrading] = useState<Task | null>(null);
  const [submissionsList, setSubmissionsList] = useState<TaskSubmission[]>([]);
  const [gradingData, setGradingData] = useState({ studentId: '', grade: '', feedback: '' });

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

  const handleOpenSubmission = (task: Task) => setSelectedTaskForSubmission(task);

  const handleFileSubmit = async () => {
    if (!instituteId || !selectedTaskForSubmission || !submissionFile || !user?.documentId) return;
    setIsSubmitting(true);
    try {
        const studentProfile = await getStudentProfile(instituteId, user.documentId);
        if (!studentProfile) throw new Error("Perfil de estudiante no encontrado.");
        
        await submitTask(instituteId, unit.id, weekNumber, selectedTaskForSubmission.id, studentProfile, submissionFile);
        toast({ title: "Tarea Entregada", description: "Tu trabajo ha sido subido correctamente." });
        setSelectedTaskForSubmission(null);
        setSubmissionFile(null);
        fetchTasks();
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleOpenGrading = async (task: Task) => {
      if (!instituteId) return;
      setSelectedTaskForGrading(task);
      const subs = await getTaskSubmissions(instituteId, unit.id, weekNumber, task.id);
      setSubmissionsList(subs.sort((a,b) => b.submittedAt.toMillis() - a.submittedAt.toMillis()));
  };

  const handleSaveGrade = async () => {
      if (!instituteId || !selectedTaskForGrading || !gradingData.studentId) return;
      setIsSubmitting(true);
      try {
          await gradeTaskSubmission(
              instituteId, unit.id, weekNumber, selectedTaskForGrading.id, selectedTaskForGrading.title,
              gradingData.studentId, Number(gradingData.grade), gradingData.feedback
          );
          toast({ title: "Nota Guardada", description: "La calificación ha sido registrada." });
          const updatedSubs = await getTaskSubmissions(instituteId, unit.id, weekNumber, selectedTaskForGrading.id);
          setSubmissionsList(updatedSubs);
          setGradingData({ studentId: '', grade: '', feedback: '' });
      } catch (error) {
          toast({ title: "Error", variant: "destructive" });
      } finally { setIsSubmitting(false); }
  };

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
                    <div key={task.id} className="p-3 rounded-lg border bg-background group">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="font-bold text-sm leading-tight">{task.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge variant="outline" className="text-[10px] font-normal"><CalendarClock className="h-3 w-3 mr-1" /> Vence: {format((task.dueDate as Timestamp).toDate(), "dd/MM")}</Badge>
                                    {isStudentView && mySub && (
                                        <Badge variant={mySub.grade !== undefined ? "default" : "secondary"} className="text-[10px] animate-in fade-in">
                                            {mySub.grade !== undefined ? `Calificado: ${mySub.grade}` : "Entregado"}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-2">
                                {isStudentView ? (
                                    <Button size="sm" variant={mySub ? "outline" : "default"} onClick={() => handleOpenSubmission(task)}>
                                        {mySub ? <Edit className="h-3 w-3 mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                                        {mySub ? "Re-entregar" : "Entregar"}
                                    </Button>
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

        <Dialog open={!!selectedTaskForSubmission} onOpenChange={() => setSelectedTaskForSubmission(null)}>
            <DialogContent>
                <DialogHeader><DialogTitle>Entregar Tarea: {selectedTaskForSubmission?.title}</DialogTitle><DialogDescription>Sube tu archivo de trabajo (PDF, Word o Imagen).</DialogDescription></DialogHeader>
                <div className="py-4 space-y-4">
                    <Input type="file" onChange={e => setSubmissionFile(e.target.files?.[0] || null)} />
                    {existingSubmissions[selectedTaskForSubmission?.id || ''] && <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">Ya has entregado esta tarea anteriormente. Subir un nuevo archivo reemplazará el anterior.</p>}
                </div>
                <DialogFooter><Button onClick={handleFileSubmit} disabled={!submissionFile || isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}Enviar Trabajo</Button></DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={!!selectedTaskForGrading} onOpenChange={() => setSelectedTaskForGrading(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader><DialogTitle>Entregas de: {selectedTaskForGrading?.title}</DialogTitle></DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {submissionsList.length > 0 ? submissionsList.map(sub => (
                        <div key={sub.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <p className="font-bold">{sub.studentName}</p>
                                    <p className="text-[10px] text-muted-foreground">{format(sub.submittedAt.toDate(), "dd/MM HH:mm")}</p>
                                    <Button variant="link" className="p-0 h-auto text-xs" asChild><a href={sub.fileUrl} target="_blank"><Download className="h-3 w-3 mr-1" /> Descargar Trabajo</a></Button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                {gradingData.studentId === sub.id ? (
                                    <div className="space-y-2 animate-in slide-in-from-right-4">
                                        <div className="flex gap-2">
                                            <Input type="number" placeholder="Nota" className="w-20" value={gradingData.grade} onChange={e => setGradingData(p => ({...p, grade: e.target.value}))} />
                                            <Textarea placeholder="Feedback..." className="h-10 text-xs" value={gradingData.feedback} onChange={e => setGradingData(p => ({...p, feedback: e.target.value}))} />
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="ghost" onClick={() => setGradingData({ studentId: '', grade: '', feedback: '' })}>Cancelar</Button>
                                            <Button size="sm" onClick={handleSaveGrade} disabled={isSubmitting}>Guardar Nota</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        {sub.grade !== undefined ? <Badge className="text-lg">Nota: {sub.grade}</Badge> : <Badge variant="secondary">Pendiente</Badge>}
                                        <Button variant="ghost" size="sm" className="ml-2" onClick={() => setGradingData({ studentId: sub.id, grade: sub.grade?.toString() || '', feedback: sub.feedback || '' })}><Edit className="h-3 w-3" /></Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : <p className="text-center py-12 text-muted-foreground">Aún no hay entregas para esta tarea.</p>}
                </div>
            </DialogContent>
        </Dialog>
    </Card>
  );
}
