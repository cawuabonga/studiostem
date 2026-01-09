
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAssetsForEnvironment, addAsset, updateAsset, deleteAsset } from '@/config/firebase';
import type { Asset } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const assetTypes = ['Equipamiento Electrónico', 'Mobiliario', 'Material Didáctico', 'Otro'];
const assetStatuses = ['Operativo', 'En Mantenimiento', 'De Baja'];

const assetSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  codeOrSerial: z.string().min(1, { message: 'El código o serial es requerido.' }),
  type: z.string({ required_error: 'Debe seleccionar un tipo.' }),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1.'),
  status: z.enum(assetStatuses as [string, ...string[]], { required_error: 'Debe seleccionar un estado.' }),
  acquisitionDate: z.date().optional(),
  notes: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetManagerProps {
    instituteId: string;
    buildingId: string;
    environmentId: string;
}

export function AssetManager({ instituteId, buildingId, environmentId }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await getAssetsForEnvironment(instituteId, buildingId, environmentId);
      setAssets(fetchedData);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los activos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, buildingId, environmentId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenForm = (asset?: Asset) => {
    setSelectedAsset(asset || null);
    form.reset({
      name: asset?.name || '',
      codeOrSerial: asset?.codeOrSerial || '',
      type: asset?.type || '',
      quantity: asset?.quantity || 1,
      status: asset?.status || 'Operativo',
      acquisitionDate: asset?.acquisitionDate?.toDate(),
      notes: asset?.notes || '',
    });
    setIsFormOpen(true);
  };
  
  const handleCloseForm = (updated?: boolean) => {
    setIsFormOpen(false);
    setSelectedAsset(null);
    if(updated) {
        fetchData();
    }
  };

  const onSubmit = async (data: AssetFormValues) => {
    try {
        const dataToSave = {
            ...data,
            environmentId,
        };
        if (selectedAsset) {
            await updateAsset(instituteId, buildingId, environmentId, selectedAsset.id, dataToSave);
            toast({ title: "Activo Actualizado" });
        } else {
            await addAsset(instituteId, buildingId, environmentId, dataToSave);
            toast({ title: "Activo Creado" });
        }
        handleCloseForm(true);
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDelete = async () => {
    if (!selectedAsset) return;
    setIsDeleting(true);
    try {
        await deleteAsset(instituteId, buildingId, environmentId, selectedAsset.id);
        toast({ title: "Activo Eliminado" });
        fetchData();
    } catch (error) {
        toast({ title: "Error", description: "No se pudo eliminar el activo.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setSelectedAsset(null);
    }
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className="flex justify-end">
            <Button size="sm" onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Activo
            </Button>
        </div>
        <div className="rounded-md border flex-1 overflow-y-auto">
            {loading ? (
                 <div className="p-4 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Código/Serial</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cant.</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assets.length > 0 ? assets.map((asset) => (
                        <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.name}</TableCell>
                            <TableCell>{asset.codeOrSerial}</TableCell>
                            <TableCell>{asset.type}</TableCell>
                            <TableCell>{asset.quantity}</TableCell>
                            <TableCell>{asset.status}</TableCell>
                            <TableCell className="text-right">
                               <Button variant="ghost" size="icon" onClick={() => handleOpenForm(asset)}><Edit2 className="h-4 w-4" /></Button>
                               <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelectedAsset(asset); setIsDeleteDialogOpen(true);}}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">No hay activos registrados en este ambiente.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
      
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedAsset ? 'Editar Activo' : 'Nuevo Activo'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Ej: Proyector Epson" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="codeOrSerial" control={form.control} render={({ field }) => (<FormItem><FormLabel>Código o N° de Serie</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField name="type" control={form.control} render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl><SelectContent>{assetTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField name="quantity" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cantidad</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField name="status" control={form.control} render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl><SelectContent>{assetStatuses.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField name="acquisitionDate" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha de Adquisición</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : (<span>Seleccionar fecha</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                        <FormField name="notes" control={form.control} render={({ field }) => (<FormItem><FormLabel>Notas</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
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
                    <AlertDialogDescription>Esta acción eliminará el activo "{selectedAsset?.name}" y no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting ? 'Eliminando...' : 'Eliminar'}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
