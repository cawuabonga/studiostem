
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTasksForWeek } from '@/config/firebase';
import type { Task, Unit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FileText, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { AddTaskForm } from './AddTaskForm';

interface TaskManagerProps {
  unit: Unit;
  weekNumber: number;
}

export function TaskManager({ unit, weekNumber }: TaskManagerProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

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
  };
  
  return (
    <Card className="bg-muted/50">
        <CardHeader>
            <CardTitle className="text-lg">Tareas de la Semana</CardTitle>
            <CardDescription>Añada tareas o actividades calificables para esta semana.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {loading ? (
                <Skeleton className="h-16 w-full" />
            ) : tasks.length > 0 ? (
                <div className="space-y-2">
                    {tasks.map(task => (
                        <div key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border bg-background p-3 gap-2">
                           <div className="flex items-start gap-3 flex-1">
                             <FileText className="h-5 w-5 mt-1" />
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

            <AddTaskForm 
                unit={unit}
                weekNumber={weekNumber}
                onTaskAdded={handleTaskAdded}
            />
        </CardContent>
    </Card>
  );
}
