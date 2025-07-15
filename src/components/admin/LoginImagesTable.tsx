
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getLoginImages, setActiveLoginImage, deleteLoginImage } from '@/config/firebase';
import type { LoginImage } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import Image from 'next/image';
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
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';


interface LoginImagesTableProps {
    onDataChange: () => void;
}

export function LoginImagesTable({ onDataChange }: LoginImagesTableProps) {
  const [images, setImages] = useState<LoginImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { instituteId } = useAuth();

  const fetchImages = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedImages = await getLoginImages(instituteId);
      setImages(fetchedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes guardadas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, instituteId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleSetActive = async (id: string) => {
    if (!instituteId) return;
    try {
        await setActiveLoginImage(instituteId, id);
        toast({ title: "¡Éxito!", description: "La imagen de inicio de sesión ha sido actualizada."});
        onDataChange();
        fetchImages();
    } catch (error) {
        toast({ title: "Error", description: "No se pudo activar la imagen.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!instituteId) return;
    try {
        await deleteLoginImage(instituteId, id);
        toast({ title: "¡Eliminada!", description: "La imagen ha sido eliminada."});
        onDataChange();
        fetchImages();
    } catch (error) {
        toast({ title: "Error", description: "No se pudo eliminar la imagen.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!images.length) {
    return <p className="text-center text-muted-foreground py-4">No hay imágenes guardadas.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Vista Previa</TableHead>
            <TableHead>Fuente</TableHead>
            <TableHead className="w-[120px]">Estado</TableHead>
            <TableHead className="w-[200px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.map((image) => (
            <TableRow key={image.id}>
              <TableCell>
                <Image 
                    src={image.url} 
                    alt="Vista previa" 
                    width={80} 
                    height={80} 
                    className="rounded-md object-cover" 
                    unoptimized
                />
              </TableCell>
              <TableCell className="font-medium truncate max-w-xs text-muted-foreground">
                Imagen guardada (Data URI)
              </TableCell>
              <TableCell>
                {image.isActive ? (
                  <Badge variant="default" className="bg-green-600">Activa</Badge>
                ) : (
                  <Badge variant="secondary">Inactiva</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleSetActive(image.id)} disabled={image.isActive}>
                   {image.isActive ? <CheckCircle className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
                  Activar
                </Button>
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={image.isActive}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la imagen.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(image.id)} className="bg-destructive hover:bg-destructive/90">
                            Sí, eliminar
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
