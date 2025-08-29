
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
    getLoginImages, 
    deleteLoginImage, 
    setActiveLoginImage,
    getLoginDesignSettings
} from '@/config/firebase';
import type { LoginImage } from '@/types';
import { Trash2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface LoginImagesTableProps {
  onDataChange: () => void;
}

export function LoginImagesTable({ onDataChange }: LoginImagesTableProps) {
  const [images, setImages] = useState<LoginImage[]>([]);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedImages, designSettings] = await Promise.all([
          getLoginImages(),
          getLoginDesignSettings()
      ]);
      setImages(fetchedImages);
      setActiveImageUrl(designSettings?.imageUrl || null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
      fetchImages();
  },[onDataChange, fetchImages]);

  const handleSetActive = async (imageUrl: string) => {
    try {
      await setActiveLoginImage(imageUrl);
      toast({
        title: "Imagen Activada",
        description: "La imagen de inicio de sesión ha sido actualizada.",
      });
      setActiveImageUrl(imageUrl);
      onDataChange();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo activar la imagen.", variant: "destructive" });
    }
  };

  const handleDelete = async (image: LoginImage) => {
    try {
      await deleteLoginImage(image);
      toast({
        title: "Imagen Eliminada",
        description: "La imagen ha sido eliminada correctamente.",
      });
      onDataChange();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar la imagen.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (!images.length) {
    return <p className="text-center text-muted-foreground py-4">mira aqui deberian aparecer la galeria de imagenes que aparecen el login para poder gestionarlas</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imagen</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Fecha de Carga</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.map((image) => (
            <TableRow key={image.id}>
              <TableCell>
                <Image
                  src={image.url}
                  alt={image.name}
                  width={100}
                  height={60}
                  className="rounded-md object-cover"
                />
              </TableCell>
              <TableCell className="font-medium">{image.name}</TableCell>
              <TableCell>
                {image.createdAt ? format(image.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                {activeImageUrl === image.url ? (
                  <Badge variant="secondary">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Activa
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleSetActive(image.url)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Establecer como activa
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleDelete(image)} className="ml-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
