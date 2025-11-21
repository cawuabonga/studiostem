
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getNewsList, addNews, updateNews, deleteNews } from '@/config/firebase';
import type { News } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash, Edit, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const newsSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  summary: z.string().min(10, 'El resumen debe tener al menos 10 caracteres.').max(200, 'El resumen no puede exceder los 200 caracteres.'),
  content: z.string().min(20, 'El contenido debe tener al menos 20 caracteres.'),
  image: z.instanceof(FileList).optional(),
});

type FormValues = z.infer<typeof newsSchema>;

interface NewsManagerProps {
    instituteId: string;
}

export function NewsManager({ instituteId }: NewsManagerProps) {
  const { toast } = useToast();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [deletingNews, setDeletingNews] = useState<News | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(newsSchema),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedNews = await getNewsList(instituteId);
      setNewsList(fetchedNews);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast({ title: "Error", description: "No se pudieron cargar las noticias.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleOpenDialog = (newsItem?: News) => {
    setEditingNews(newsItem || null);
    form.reset({
        title: newsItem?.title || '',
        summary: newsItem?.summary || '',
        content: newsItem?.content || '',
        image: undefined,
    });
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingNews(null);
  };

  const handleSave = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const { image, ...newsData } = data;
      const imageFile = image && image.length > 0 ? image[0] : undefined;

      if (editingNews) {
        await updateNews(instituteId, editingNews.id, newsData, imageFile);
        toast({ title: "Noticia Actualizada", description: "La noticia ha sido actualizada." });
      } else {
        await addNews(instituteId, newsData, imageFile);
        toast({ title: "Noticia Creada", description: "La nueva noticia ha sido publicada." });
      }
      fetchData();
      handleDialogClose();
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingNews) return;
    try {
        await deleteNews(instituteId, deletingNews);
        toast({ title: "Noticia Eliminada", description: "La noticia ha sido eliminada." });
        fetchData();
    } catch (error: any) {
        toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } finally {
        setDeletingNews(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestionar Noticias</CardTitle>
            <CardDescription>
              Crea, edita o elimina las noticias y anuncios de la página pública del instituto.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Crear Noticia
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Resumen</TableHead>
                        <TableHead>Fecha de Creación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={4}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                    ) : newsList.length > 0 ? (
                        newsList.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium max-w-xs truncate">{item.title}</TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-sm truncate">{item.summary}</TableCell>
                                <TableCell>{format(item.createdAt.toDate(), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingNews(item)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow><TableCell colSpan={4} className="h-24 text-center">No hay noticias registradas.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                  <DialogTitle>{editingNews ? 'Editar Noticia' : 'Crear Nueva Noticia'}</DialogTitle>
                  <DialogDescription>
                      Complete los detalles de la noticia. La imagen es opcional.
                  </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                    <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="summary" render={({ field }) => (<FormItem><FormLabel>Resumen (Corto)</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Contenido Completo</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="image" render={({ field }) => (
                         <FormItem>
                             <FormLabel>Imagen (Opcional)</FormLabel>
                             {editingNews?.imageUrl && !field.value && (
                                <div className="text-sm text-muted-foreground">
                                    <p>Imagen actual:</p>
                                    <div className="relative h-20 w-32 rounded-md overflow-hidden mt-1">
                                        <Image src={editingNews.imageUrl} alt="Imagen actual" fill className="object-cover" />
                                    </div>
                                    <p className="mt-1">Para reemplazarla, suba un nuevo archivo.</p>
                                </div>
                             )}
                             <FormControl><Input type="file" accept="image/png, image/jpeg, image/webp" {...form.register('image')} /></FormControl>
                             <FormMessage />
                         </FormItem>
                    )} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {editingNews ? 'Guardar Cambios' : 'Publicar Noticia'}
                        </Button>
                    </DialogFooter>
                </form>
              </Form>
          </DialogContent>
      </Dialog>
      
       <AlertDialog open={!!deletingNews} onOpenChange={(open) => !open && setDeletingNews(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará la noticia "{deletingNews?.title}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingNews(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
