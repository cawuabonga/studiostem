

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWeekData, deleteTaskFromWeek } from '@/config/firebase';
import type { Task, Unit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FileText, CalendarClock, PlusCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { AddTaskForm } from './AddTaskForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '../ui/button';
import { Timestamp } from 'firebase/firestore';

interface TaskManagerProps {
  unit: Unit;
  weekNumber: number;
  isStudentView: boolean;
}

export function TaskManager({ unit, weekNumber, isStudentView }: TaskManagerProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);


  const fetchTasks = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const weekData = await getWeekData(instituteId, unit.id, weekNumber);
      setTasks(weekData?.tasks || []);
    } catch (error) {
      console.error(`Error fetching tasks for week ${weekNumber}:`, error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas de la semana.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, unit.id, weekNumber, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, version]);

  const handleDataChange = () => {
    setVersion(v => v + 1);
    setIsFormOpen(false);
    setEditingTask(null);
  };
  
  const handleOpenForm = (task: Task | null = null) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }

  const handleDelete = async (taskId: string, taskTitle: string) => {
    if (!instituteId) return;
    try {
        await deleteTaskFromWeek(instituteId, unit.id, weekNumber, taskId);
        toast({ title: "Tarea Eliminada", description: `La tarea "${taskTitle}" ha sido eliminada.` });
        setVersion(v => v + 1);
    } catch (error) {
        console.error("Error deleting task:", error);
        toast({ title: "Error", description: "No se pudo eliminar la tarea.", variant: "destructive" });
    }
  };
  
  return (
    <Card className="bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-lg">Tareas de la Semana</CardTitle>
                <CardDescription>Actividades calificables para esta semana.</CardDescription>
            </div>
             {!isStudentView && (
                <Button variant="outline" size="sm" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Tarea
                </Button>
             )}
        </CardHeader>
        <CardContent className="space-y-4">
            {loading ? (
                <Skeleton className="h-16 w-full" />
            ) : tasks.length > 0 ? (
                <div className="space-y-2">
                    {tasks.map(task => (
                        <div key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border bg-background p-3 gap-2">
                           <div className="flex items-start gap-3 flex-1">
                             <FileText className="h-5 w-5 mt-1 text-purple-500" />
                             <div className="flex-1">
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0 ml-8 sm:ml-0">
                                <CalendarClock className="h-4 w-4" />
                                <span>Vence: {task.dueDate instanceof Timestamp ? format(task.dueDate.toDate(), "dd/MM/yyyy 'a las' HH:mm") : 'Fecha inválida'}</span>
                           </div>
                            {!isStudentView && (
                             <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenForm(task)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar
                                        </DropdownMenuItem>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro de eliminar esta tarea?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Se eliminará la tarea "{task.title}".
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(task.id, task.title)}>Sí, eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                           )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                    Aún no hay tareas para esta semana.
                </p>
            )}
        </CardContent>

         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingTask ? 'Editar Tarea' : 'Añadir Nueva Tarea'} a la Semana {weekNumber}</DialogTitle>
                </DialogHeader>
                <AddTaskForm 
                    unit={unit}
                    weekNumber={weekNumber}
                    onDataChanged={handleDataChange}
                    onCancel={() => setIsFormOpen(false)}
                    initialData={editingTask}
                />
            </DialogContent>
        </Dialog>
    </Card>
  );
}
