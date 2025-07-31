
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getContentsForWeek, deleteContentFromWeek } from '@/config/firebase';
import type { Content, Unit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AddContentForm } from './AddContentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FileText, Link, Type, PlusCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
}

const getIconForType = (type: Content['type']) => {
    switch(type) {
        case 'file': return <FileText className="h-5 w-5 text-blue-500" />;
        case 'link': return <Link className="h-5 w-5 text-green-500" />;
        case 'text': return <Type className="h-5 w-5 text-orange-500" />;
        default: return <FileText className="h-5 w-5" />;
    }
}


export function ContentManager({ unit, weekNumber, isStudentView }: ContentManagerProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchContents = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedContents = await getContentsForWeek(instituteId, unit.id, weekNumber);
      setContents(fetchedContents);
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
  }, [fetchContents, version]);

  const handleContentAdded = () => {
    setVersion(v => v + 1);
    setIsAddOpen(false); // Close dialog on success
  };

  const handleDelete = async (contentToDelete: Content) => {
    if (!instituteId) return;
    try {
        await deleteContentFromWeek(instituteId, unit.id, weekNumber, contentToDelete);
        toast({ title: "Contenido Eliminado", description: "El recurso ha sido eliminado correctamente." });
        setVersion(v => v + 1);
    } catch (error) {
        console.error("Error deleting content:", error);
        toast({ title: "Error", description: "No se pudo eliminar el contenido.", variant: "destructive" });
    }
  }
  
  return (
    <Card className="bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-lg">Contenidos de la Semana</CardTitle>
                <CardDescription>Recursos como archivos, enlaces o texto.</CardDescription>
            </div>
            {!isStudentView && (
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Contenido
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Añadir Nuevo Contenido a la Semana {weekNumber}</DialogTitle>
                        </DialogHeader>
                        <AddContentForm 
                            unit={unit}
                            weekNumber={weekNumber}
                            onContentAdded={handleContentAdded}
                            onCancel={() => setIsAddOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
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
                                href={content.type === 'link' || content.type === 'file' ? content.value : undefined} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`font-medium ${content.type !== 'text' ? 'hover:underline' : 'cursor-default'}`}
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
                                        <DropdownMenuItem disabled>
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
                                        Si es un archivo, también será borrado del almacenamiento.
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
    </Card>
  );
}
