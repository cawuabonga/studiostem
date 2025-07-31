
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTasksForWeek } from '@/config/firebase';
import type { Task, Unit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FileText, CalendarClock, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { AddTaskForm } from './AddTaskForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '../ui/button';

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
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedTasks = await getTasksForWeek(instituteId, unit.id, weekNumber);
      setTasks(fetchedTasks);
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

  const handleTaskAdded = () => {
    setVersion(v => v + 1);
    setIsAddOpen(false); // Close dialog on success
  };
  
  return (
    <Card className="bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-lg">Tareas de la Semana</CardTitle>
                <CardDescription>Actividades calificables para esta semana.</CardDescription>
            </div>
             {!isStudentView && (
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Tarea
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Añadir Nueva Tarea a la Semana {weekNumber}</DialogTitle>
                        </DialogHeader>
                        <AddTaskForm 
                            unit={unit}
                            weekNumber={weekNumber}
                            onTaskAdded={handleTaskAdded}
                            onCancel={() => setIsAddOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
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
                                <span>Vence: {format(task.dueDate.toDate(), "dd/MM/yyyy 'a las' HH:mm")}</span>
                           </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                    Aún no hay tareas para esta semana.
                </p>
            )}
        </CardContent>
    </Card>
  );
}
