

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { AccessPoint, Role } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAccessPoints, addAccessPoint, updateAccessPoint, deleteAccessPoint, getRoles } from '@/config/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, PlusCircle, Trash, Edit, BarChart3, ChevronRight } from 'lucide-react';
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
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';

const accessPointSchema = z.object({
  accessPointId: z.string().min(1, 'El ID del dispositivo es requerido.'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().optional(),
  allowedRoleIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof accessPointSchema>;

export function AccessPointManager() {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  
  const [points, setPoints] = useState<AccessPoint[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPoint, setEditingPoint] = useState<AccessPoint | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<AccessPoint | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(accessPointSchema),
  });

  const fetchData = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const [fetchedPoints, fetchedRoles] = await Promise.all([
        getAccessPoints(instituteId),
        getRoles(instituteId),
      ]);
      setPoints(fetchedPoints);
      setRoles(fetchedRoles);
    } catch (error) {
      console.error("Error fetching access points/roles:", error);
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (point?: AccessPoint) => {
    setEditingPoint(point || null);
    form.reset({
        accessPointId: point?.accessPointId || '', 
        name: point?.name || '', 
        description: point?.description || '',
        allowedRoleIds: point?.allowedRoleIds || [],
    });
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
      setIsDialogOpen(false);
      setEditingPoint(null);
  };

  const handleSave = async (data: FormValues) => {
    if (!instituteId) return;
    
    setIsSubmitting(true);
    const dataToSave = {
        ...data,
        allowedRoleIds: data.allowedRoleIds || []
    }

    try {
      if (editingPoint) {
        await updateAccessPoint(instituteId, editingPoint.id, dataToSave);
        toast({ title: "Punto de Acceso Actualizado", description: `"${data.name}" ha sido actualizado.` });
      } else {
        await addAccessPoint(instituteId, dataToSave);
        toast({ title: "Punto de Acceso Creado", description: `"${data.name}" ha sido creado.` });
      }
      fetchData();
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
        fetchData();
    } catch (error: any) {
        toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } finally {
        setDeletingPoint(null);
    }
  };

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || roleId;

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
                    <TableHead>Roles Permitidos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                ) : points.length > 0 ? (
                    points.map(point => (
                        <TableRow key={point.id} className="group">
                            <TableCell className="font-medium">
                                <Link href={`/dashboard/control-de-acceso/puntos-de-acceso/${point.id}`} className="hover:underline flex items-center">
                                    {point.name}
                                    <ChevronRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </Link>
                                <p className="text-xs text-muted-foreground font-mono">{point.accessPointId}</p>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {point.allowedRoleIds?.length > 0 ? point.allowedRoleIds.map(roleId => (
                                        <Badge key={roleId} variant="secondary">{getRoleName(roleId)}</Badge>
                                    )) : (
                                        <span className="text-xs text-muted-foreground">Ninguno</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                 <Button variant="outline" size="sm" asChild className="mr-2">
                                    <Link href={`/dashboard/control-de-acceso/puntos-de-acceso/${point.id}`}>
                                        <BarChart3 className="mr-2 h-4 w-4"/>
                                        Estadísticas
                                    </Link>
                                </Button>
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
                     <TableRow><TableCell colSpan={3} className="h-24 text-center">No hay puntos de acceso registrados.</TableCell></TableRow>
                )}
            </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>{editingPoint ? 'Editar' : 'Nuevo'} Punto de Acceso</DialogTitle>
                  <DialogDescription>
                      Complete la información del dispositivo y asigne los roles que tendrán acceso.
                  </DialogDescription>
              </DialogHeader>
               <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><Label>Nombre Descriptivo</Label><FormControl><Input {...field} placeholder="Ej: Puerta Principal" /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="accessPointId" render={({ field }) => (<FormItem><Label>ID del Dispositivo</Label><FormControl><Input {...field} placeholder="Ej: PUERTA-01" /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><Label>Descripción (Opcional)</Label><FormControl><Input {...field} placeholder="Ubicación o detalle adicional" /></FormControl><FormMessage /></FormItem>)}/>
                        
                         <FormField
                            control={form.control}
                            name="allowedRoleIds"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Roles Permitidos</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                        Selecciona los roles que podrán acceder a través de este punto.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {roles.map((role) => (
                                            <FormField
                                            key={role.id}
                                            control={form.control}
                                            name="allowedRoleIds"
                                            render={({ field }) => {
                                                return (
                                                <FormItem
                                                    key={role.id}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(role.id)}
                                                        onCheckedChange={(checked) => {
                                                        return checked
                                                            ? field.onChange([...(field.value || []), role.id])
                                                            : field.onChange(
                                                                field.value?.filter(
                                                                (value) => value !== role.id
                                                                )
                                                            )
                                                        }}
                                                    />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {role.name}
                                                    </FormLabel>
                                                </FormItem>
                                                )
                                            }}
                                            />
                                        ))}
                                    </div>
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

    