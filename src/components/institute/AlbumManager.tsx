"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAlbums, addAlbum, updateAlbum, deleteAlbum } from '@/config/firebase';
import type { Album } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash, Edit, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Link from 'next/link';

const albumSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof albumSchema>;

interface AlbumManagerProps {
    instituteId: string;
}

export function AlbumManager({ instituteId }: AlbumManagerProps) {
  const { toast } = useToast();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(albumSchema),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedAlbums = await getAlbums(instituteId);
      setAlbums(fetchedAlbums);
    } catch (error) {
      console.error("Error fetching albums:", error);
      toast({ title: "Error", description: "No se pudieron cargar los álbumes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleOpenDialog = (album?: Album) => {
    setEditingAlbum(album || null);
    form.reset({
        name: album?.name || '',
        description: album?.description || '',
    });
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAlbum(null);
  };

  const handleSave = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (editingAlbum) {
        await updateAlbum(instituteId, editingAlbum.id, data);
        toast({ title: "Álbum Actualizado", description: "El álbum ha sido actualizado." });
      } else {
        await addAlbum(instituteId, data);
        toast({ title: "Álbum Creado", description: "El nuevo álbum ha sido creado." });
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
    if (!deletingAlbum) return;
    try {
        await deleteAlbum(instituteId, deletingAlbum.id);
        toast({ title: "Álbum Eliminado", description: "El álbum y todas sus fotos han sido eliminados." });
        fetchData();
    } catch (error: any) {
        toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } finally {
        setDeletingAlbum(null);
    }
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Gestionar Galería de Fotos</CardTitle>
                <CardDescription>
                Crea y administra álbumes de fotos para mostrar en la página pública de tu instituto.
                </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Crear Álbum
            </Button>
            </CardHeader>
        </Card>
      
        {loading ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        ) : albums.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {albums.map(album => (
                    <Card key={album.id} className="group">
                        <div className="relative w-full h-40">
                             <Image 
                                src={album.coverImageUrl || 'https://placehold.co/600x400.png?text=Galeria'} 
                                alt={album.name} 
                                fill 
                                className="object-cover rounded-t-lg"
                                data-ai-hint="photo gallery"
                            />
                        </div>
                        <CardHeader>
                            <CardTitle>{album.name}</CardTitle>
                            <CardDescription className="line-clamp-2 h-10">{album.description}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-between">
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(album)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingAlbum(album)}><Trash className="h-4 w-4"/></Button>
                            </div>
                            <Button asChild>
                                <Link href={`/dashboard/gestion-instituto/galeria/${album.id}`}>
                                    Gestionar Fotos <ArrowRight className="ml-2 h-4 w-4"/>
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    No hay álbumes creados. ¡Crea el primero para empezar a añadir fotos!
                </CardContent>
            </Card>
        )}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingAlbum ? 'Editar Álbum' : 'Crear Nuevo Álbum'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre del Álbum</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción (Opcional)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {editingAlbum ? 'Guardar Cambios' : 'Crear Álbum'}
                        </Button>
                    </DialogFooter>
                </form>
              </Form>
          </DialogContent>
      </Dialog>
      
       <AlertDialog open={!!deletingAlbum} onOpenChange={(open) => !open && setDeletingAlbum(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará el álbum "{deletingAlbum?.name}" y todas las fotos que contiene.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingAlbum(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
