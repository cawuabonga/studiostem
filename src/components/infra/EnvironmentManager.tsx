
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getEnvironmentsForBuilding, addEnvironment, updateEnvironment, deleteEnvironment } from '@/config/firebase';
import type { Environment } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, MoreHorizontal, PlusCircle, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AssetManager } from './AssetManager';

const environmentTypes = ['Aula', 'Laboratorio', 'Oficina', 'Auditorio', 'Taller', 'Otro'];

const environmentSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  code: z.string().min(1, { message: 'El código es requerido.' }),
  type: z.string({ required_error: 'Debe seleccionar un tipo.' }),
  capacity: z.coerce.number().min(1, 'La capacidad debe ser al menos 1.'),
  floor: z.coerce.number().optional(),
});

type EnvironmentFormValues = z.infer<typeof environmentSchema>;

interface EnvironmentManagerProps {
    instituteId: string;
    buildingId: string;
    onDataChange: () => void;
}

const PAGE_SIZE = 5;

export function EnvironmentManager({ instituteId, buildingId, onDataChange }: EnvironmentManagerProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(environmentSchema),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await getEnvironmentsForBuilding(instituteId, buildingId);
      setEnvironments(fetchedData);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los ambientes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, buildingId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return environments.slice(start, end);
  }, [environments, currentPage]);

  const totalPages = Math.ceil(environments.length / PAGE_SIZE);

  const handleOpenForm = (environment?: Environment) => {
    setSelectedEnvironment(environment || null);
    form.reset(environment || { name: '', code: '', type: '', capacity: 0, floor: 0 });
    setIsFormOpen(true);
  };

  const handleOpenAssets = (environment: Environment) => {
    setSelectedEnvironment(environment);
    setIsAssetsOpen(true);
  }
  
  const handleCloseForm = (updated?: boolean) => {
    setIsFormOpen(false);
    setSelectedEnvironment(null);
    if(updated) {
        fetchData();
        onDataChange();
    }
  };

  const onSubmit = async (data: EnvironmentFormValues) => {
    try {
        if (selectedEnvironment) {
            await updateEnvironment(instituteId, buildingId, selectedEnvironment.id, data);
            toast({ title: "Ambiente Actualizado" });
        } else {
            await addEnvironment(instituteId, buildingId, data);
            toast({ title: "Ambiente Creado" });
        }
        handleCloseForm(true);
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDelete = async () => {
    if (!selectedEnvironment) return;
    setIsDeleting(true);
    try {
        await deleteEnvironment(instituteId, buildingId, selectedEnvironment.id);
        toast({ title: "Ambiente Eliminado" });
        fetchData();
        onDataChange();
    } catch (error) {
        toast({ title: "Error", description: "No se pudo eliminar el ambiente.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setSelectedEnvironment(null);
    }
  };


  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Button size="sm" onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Ambiente
            </Button>
        </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Piso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? paginatedData.map((env) => (
              <TableRow key={env.id}>
                <TableCell className="font-medium">{env.name}</TableCell>
                <TableCell>{env.code}</TableCell>
                <TableCell>{env.type}</TableCell>
                <TableCell>{env.capacity}</TableCell>
                <TableCell>{env.floor || 'N/A'}</TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenAssets(env)}><Package className="mr-2 h-4 w-4" /> Gestionar Activos</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenForm(env)}><Edit2 className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {setSelectedEnvironment(env); setIsDeleteDialogOpen(true);}} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
                 <TableRow><TableCell colSpan={6} className="h-24 text-center">No hay ambientes registrados para este edificio.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
         <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Anterior</Button>
            <span className="text-sm">Página {currentPage} de {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Siguiente</Button>
        </div>
      )}
      
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedEnvironment ? 'Editar Ambiente' : 'Nuevo Ambiente'}</DialogTitle>
                    <DialogDescription>Complete los detalles del espacio físico.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Ej: Aula 101" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="code" control={form.control} render={({ field }) => (<FormItem><FormLabel>Código</FormLabel><FormControl><Input {...field} placeholder="Ej: A101" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="type" control={form.control} render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl><SelectContent>{environmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField name="capacity" control={form.control} render={({ field }) => (<FormItem><FormLabel>Capacidad</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField name="floor" control={form.control} render={({ field }) => (<FormItem><FormLabel>Piso</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción eliminará el ambiente "{selectedEnvironment?.name}" y no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting ? 'Eliminando...' : 'Eliminar'}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {selectedEnvironment && (
             <Dialog open={isAssetsOpen} onOpenChange={setIsAssetsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Gestión de Activos para: {selectedEnvironment.name}</DialogTitle>
                        <DialogDescription>
                            Administre el inventario de mobiliario, equipos y otros activos de este ambiente.
                        </DialogDescription>
                    </DialogHeader>
                    <AssetManager 
                        instituteId={instituteId} 
                        buildingId={buildingId} 
                        environmentId={selectedEnvironment.id}
                    />
                </DialogContent>
            </Dialog>
        )}

    </div>
  );
}
