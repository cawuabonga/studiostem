

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWeekData, deleteContentFromWeek } from '@/config/firebase';
import type { Content, Unit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AddContentForm } from './AddContentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FileText, Link as LinkIcon, Type, PlusCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
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

interface ContentManagerProps {
  unit: Unit;
  weekNumber: number;
  isStudentView: boolean;
  onDataChanged: () => void;
}

const getIconForType = (type: Content['type']) => {
    switch(type) {
        case 'file': return <FileText className="h-5 w-5 text-blue-500" />;
        case 'link': return <LinkIcon className="h-5 w-5 text-green-500" />;
        case 'text': return <Type className="h-5 w-5 text-orange-500" />;
        default: return <FileText className="h-5 w-5" />;
    }
}

export function ContentManager({ unit, weekNumber, isStudentView, onDataChanged }: ContentManagerProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);

  const fetchContents = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const weekData = await getWeekData(instituteId, unit.id, weekNumber);
      setContents(weekData?.contents || []);
    } catch (error) {
      console.error(`Error fetching contents for week ${weekNumber}:`, error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contenidos de la semana.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, unit.id, weekNumber, toast]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleDataChange = () => {
    fetchContents();
    setIsFormOpen(false);
    setEditingContent(null);
    onDataChanged();
  };
  
  const handleOpenForm = (content: Content | null = null) => {
    setEditingContent(content);
    setIsFormOpen(true);
  }

  const handleDelete = async (contentToDelete: Content) => {
    if (!instituteId) return;
    try {
        await deleteContentFromWeek(instituteId, unit.id, weekNumber, contentToDelete);
        toast({ title: "Contenido Eliminado", description: "El recurso ha sido eliminado correctamente." });
        handleDataChange();
    } catch (error) {
        console.error("Error deleting content:", error);
        toast({ title: "Error", description: "No se pudo eliminar el contenido.", variant: "destructive" });
    }
  }
  
  return (
    <Card className="bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-lg">Contenidos de Apoyo</CardTitle>
                <CardDescription>Recursos como archivos, enlaces o texto.</CardDescription>
            </div>
            {!isStudentView && (
                <Button variant="outline" size="sm" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Contenido
                </Button>
            )}
        </CardHeader>
        <CardContent className="space-y-4">
            {loading ? (
                <Skeleton className="h-16 w-full" />
            ) : contents.length > 0 ? (
                <div className="space-y-2">
                    {contents.map(content => (
                        <div key={content.id} className="flex items-center justify-between rounded-md border bg-background p-3">
                           <div className="flex items-center gap-3 flex-1">
                             {getIconForType(content.type)}
                             <a 
                                href={content.value} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`font-medium ${content.type !== 'text' ? 'hover:underline' : 'cursor-default'}`}
                                download={content.type === 'file' ? content.title : undefined}
                            >
                                {content.title}
                            </a>
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
                                        <DropdownMenuItem onClick={() => handleOpenForm(content)}>
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
                                    <AlertDialogTitle>¿Estás seguro de eliminar este contenido?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Se eliminará el contenido "{content.title}".
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(content)}>Sí, eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                           )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                    Aún no hay contenidos para esta semana.
                </p>
            )}
        </CardContent>

         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingContent ? 'Editar Contenido' : 'Añadir Nuevo Contenido'} a la Semana {weekNumber}</DialogTitle>
                </DialogHeader>
                <AddContentForm 
                    unit={unit}
                    weekNumber={weekNumber}
                    onDataChanged={handleDataChange}
                    onCancel={() => setIsFormOpen(false)}
                    initialData={editingContent}
                />
            </DialogContent>
        </Dialog>
    </Card>
  );
}
