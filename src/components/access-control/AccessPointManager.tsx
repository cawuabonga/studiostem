
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { AccessPoint } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAccessPoints, addAccessPoint, updateAccessPoint, deleteAccessPoint } from '@/config/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, PlusCircle, Trash, Edit } from 'lucide-react';
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

const accessPointSchema = z.object({
  accessPointId: z.string().min(1, 'El ID del dispositivo es requerido.'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof accessPointSchema>;

export function AccessPointManager() {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  
  const [points, setPoints] = useState<AccessPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPoint, setEditingPoint] = useState<AccessPoint | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<AccessPoint | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(accessPointSchema),
  });

  const fetchPoints = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedPoints = await getAccessPoints(instituteId);
      setPoints(fetchedPoints);
    } catch (error) {
      console.error("Error fetching access points:", error);
      toast({ title: "Error", description: "No se pudieron cargar los puntos de acceso.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const handleOpenDialog = (point?: AccessPoint) => {
    setEditingPoint(point || null);
    form.reset(point || { accessPointId: '', name: '', description: '' });
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
      setIsDialogOpen(false);
      setEditingPoint(null);
  };

  const handleSave = async (data: FormValues) => {
    if (!instituteId) return;
    
    setIsSubmitting(true);
    try {
      if (editingPoint) {
        await updateAccessPoint(instituteId, editingPoint.id, data);
        toast({ title: "Punto de Acceso Actualizado", description: `"${data.name}" ha sido actualizado.` });
      } else {
        await addAccessPoint(instituteId, data);
        toast({ title: "Punto de Acceso Creado", description: `"${data.name}" ha sido creado.` });
      }
      fetchPoints();
      handleDialogClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!instituteId || !deletingPoint) return;
    try {
        await deleteAccessPoint(instituteId, deletingPoint.id);
        toast({ title: "Punto de Acceso Eliminado", description: "El punto de acceso ha sido eliminado." });
        fetchPoints();
    } catch (error: any) {
        toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } finally {
        setDeletingPoint(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4"/>
          Añadir Punto de Acceso
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre del Punto de Acceso</TableHead>
                    <TableHead>ID del Dispositivo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                ) : points.length > 0 ? (
                    points.map(point => (
                        <TableRow key={point.id}>
                            <TableCell className="font-medium">{point.name}</TableCell>
                            <TableCell className="font-mono text-xs">{point.accessPointId}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{point.description}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(point)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingPoint(point)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                     <TableRow><TableCell colSpan={4} className="h-24 text-center">No hay puntos de acceso registrados.</TableCell></TableRow>
                )}
            </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingPoint ? 'Editar' : 'Nuevo'} Punto de Acceso</DialogTitle>
                  <DialogDescription>
                      Complete la información del dispositivo lector (Arduino, etc.).
                  </DialogDescription>
              </DialogHeader>
               <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Nombre Descriptivo</Label>
                                    <FormControl>
                                        <Input {...field} placeholder="Ej: Puerta Principal" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="accessPointId"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>ID del Dispositivo</Label>
                                    <FormControl>
                                        <Input {...field} placeholder="Ej: PUERTA-01" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Descripción (Opcional)</Label>
                                    <FormControl>
                                        <Input {...field} placeholder="Ubicación o detalle adicional" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button variant="ghost" type="button">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
               </Form>
          </DialogContent>
      </Dialog>
      
       <AlertDialog open={!!deletingPoint} onOpenChange={(open) => !open && setDeletingPoint(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará el punto de acceso "{deletingPoint?.name}".
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingPoint(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
