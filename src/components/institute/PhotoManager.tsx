"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getAlbumPhotos, addPhotosToAlbum, deletePhotoFromAlbum, getAlbum } from '@/config/firebase';
import type { Photo, Album } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface PhotoManagerProps {
    instituteId: string;
    albumId: string;
}

export function PhotoManager({ instituteId, albumId }: PhotoManagerProps) {
  const { toast } = useToast();
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [albumData, photoData] = await Promise.all([
          getAlbum(instituteId, albumId),
          getAlbumPhotos(instituteId, albumId)
      ]);
      setAlbum(albumData);
      setPhotos(photoData);
    } catch (error) {
      console.error("Error fetching album photos:", error);
      toast({ title: "Error", description: "No se pudieron cargar las fotos del álbum.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, albumId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({ title: 'No hay archivos', description: 'Por favor, selecciona al menos una imagen para subir.', variant: 'destructive'});
      return;
    }
    setIsUploading(true);
    try {
      await addPhotosToAlbum(instituteId, albumId, Array.from(files));
      toast({ title: 'Subida Completa', description: `${files.length} foto(s) añadida(s) al álbum.` });
      setFiles(null);
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({ title: 'Error al Subir', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDelete = async (photo: Photo) => {
    try {
        await deletePhotoFromAlbum(instituteId, albumId, photo);
        toast({ title: 'Foto Eliminada', description: 'La imagen ha sido eliminada del álbum.'});
        fetchData();
    } catch (error: any) {
        toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>{loading ? <Skeleton className="h-8 w-1/2" /> : `Gestionar Fotos: ${album?.name}`}</CardTitle>
                <CardDescription>{loading ? <Skeleton className="h-4 w-3/4" /> : album?.description}</CardDescription>
            </CardHeader>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Subir Nuevas Fotos</CardTitle>
                <CardDescription>Selecciona una o varias imágenes para añadir a este álbum.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <Input id="photo-upload" type="file" multiple onChange={handleFileChange} className="flex-grow"/>
                    <Button onClick={handleUpload} disabled={isUploading || !files}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                        {isUploading ? 'Subiendo...' : `Subir ${files?.length || ''} Imagen(es)`}
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle className="text-lg">Fotos del Álbum</CardTitle>
            </CardHeader>
             <CardContent>
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
                    </div>
                ) : photos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {photos.map(photo => (
                            <div key={photo.id} className="relative group aspect-square">
                                <Image src={photo.url} alt="Foto del álbum" fill className="object-cover rounded-md" data-ai-hint="gallery photo" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button size="icon" variant="destructive" onClick={() => handleDelete(photo)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                        <ImageIcon className="h-12 w-12 mb-4" />
                        <p>Este álbum está vacío.</p>
                        <p className="text-sm">¡Sube la primera foto!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
