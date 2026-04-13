
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWeekData, deleteContentFromWeek } from '@/config/firebase';
import type { Content, Unit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AddContentForm } from './AddContentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FileText, Link as LinkIcon, Type, PlusCircle, MoreVertical, Edit, Trash2, PlayCircle, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const getIconForType = (content: Content) => {
    if (content.type === 'link' && getYouTubeId(content.value)) {
        return <PlayCircle className="h-5 w-5 text-red-500" />;
    }
    switch(content.type) {
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
  const [previewContent, setPreviewContent] = useState<Content | null>(null);

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
    <Card className="bg-muted/50 shadow-sm border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
                <CardTitle className="text-lg">Materiales de Estudio</CardTitle>
                <CardDescription>Lecturas, videos y enlaces de interés.</CardDescription>
            </div>
            {!isStudentView && (
                <Button variant="outline" size="sm" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Material
                </Button>
            )}
        </CardHeader>
        <CardContent className="space-y-4">
            {loading ? (
                <Skeleton className="h-16 w-full" />
            ) : contents.length > 0 ? (
                <div className="space-y-2">
                    {contents.map(content => {
                        const ytId = content.type === 'link' ? getYouTubeId(content.value) : null;
                        const isPdf = content.type === 'file' && content.value.toLowerCase().includes('.pdf');

                        return (
                            <div key={content.id} className="flex items-center justify-between rounded-lg border bg-background p-3 shadow-sm hover:border-primary/30 transition-all group">
                               <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                 {getIconForType(content)}
                                 <div className="truncate">
                                    <p className="font-bold text-sm truncate">{content.title}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                                        {content.type === 'text' ? 'Nota de Texto' : content.type}
                                    </p>
                                 </div>
                               </div>
                               <div className="flex items-center gap-2">
                                    {content.type === 'text' ? (
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="h-8 text-[10px] font-bold uppercase tracking-tight"
                                            onClick={() => setPreviewContent(content)}
                                        >
                                            <FileText className="mr-1 h-3 w-3" />
                                            Leer Nota
                                        </Button>
                                    ) : (
                                        <>
                                            {(ytId || isPdf) && (
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="h-8 text-[10px] font-bold uppercase tracking-tight"
                                                    onClick={() => setPreviewContent(content)}
                                                >
                                                    {ytId ? <PlayCircle className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                                                    {ytId ? "Reproducir" : "Ver PDF"}
                                                </Button>
                                            )}
                                            
                                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-tight" asChild>
                                                <a href={content.value} target="_blank" rel="noopener noreferrer">Abrir</a>
                                            </Button>
                                        </>
                                    )}

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
                                                <AlertDialogTitle>¿Eliminar este material?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Se eliminará "{content.title}".
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
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-center text-sm text-muted-foreground py-10 italic border-2 border-dashed rounded-lg">
                    No hay materiales publicados para esta semana.
                </p>
            )}
        </CardContent>

         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{editingContent ? 'Editar Material' : 'Nuevo Material'} - Semana {weekNumber}</DialogTitle>
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

        {/* Previsualización Modal */}
        <Dialog open={!!previewContent} onOpenChange={(open) => !open && setPreviewContent(null)}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{previewContent?.title}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                    {previewContent?.type === 'text' ? (
                        <div className="flex-1 bg-background p-8 overflow-y-auto w-full h-full">
                            <div className="max-w-3xl mx-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                {previewContent.value}
                            </div>
                        </div>
                    ) : previewContent && getYouTubeId(previewContent.value) ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${getYouTubeId(previewContent.value)}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : previewContent?.type === 'file' ? (
                        <iframe
                            src={previewContent.value}
                            width="100%"
                            height="100%"
                            className="bg-white"
                        ></iframe>
                    ) : (
                        <div className="text-white p-8 text-center">
                            Este tipo de contenido no soporta previsualización directa. 
                            <Button variant="link" className="text-white underline" asChild>
                                <a href={previewContent?.value} target="_blank">Abrir en nueva pestaña</a>
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter className="p-4 border-t bg-muted/20">
                    <Button variant="ghost" onClick={() => setPreviewContent(null)}>Cerrar Visor</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </Card>
  );
}
