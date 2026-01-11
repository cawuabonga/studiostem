
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAssetTypes, addAssetType, updateAssetType, deleteAssetType } from '@/config/firebase';
import type { AssetType, AssetCategory } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';

const assetCategories: AssetCategory[] = ['Equipamiento Electrónico', 'Mobiliario', 'Material Didáctico', 'Otro'];

const assetTypeSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  code: z.string().min(1, 'El código es requerido.'),
  category: z.enum(assetCategories as [string, ...string[]], { required_error: 'Debe seleccionar una categoría.' }),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof assetTypeSchema>;

interface AssetCatalogManagerProps {
    instituteId: string;
}

export function AssetCatalogManager({ instituteId }: AssetCatalogManagerProps) {
  const { toast } = useToast();
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAssetType, setEditingAssetType] = useState<AssetType | null>(null);
  const [deletingAssetType, setDeletingAssetType] = useState<AssetType | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(assetTypeSchema),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await getAssetTypes(instituteId);
      setAssetTypes(fetchedData);
    } catch (error) {
      console.error("Error fetching asset types:", error);
      toast({ title: "Error", description: "No se pudieron cargar los tipos de activo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (assetType?: AssetType) => {
    setEditingAssetType(assetType || null);
    form.reset({
        name: assetType?.name || '', 
        code: assetType?.code || '',
        category: assetType?.category || undefined,
        description: assetType?.description || '',
    });
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
      setIsDialogOpen(false);
      setEditingAssetType(null);
  };

  const handleSave = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (editingAssetType) {
        await updateAssetType(instituteId, editingAssetType.id, data);
        toast({ title: "Tipo de Activo Actualizado" });
      } else {
        await addAssetType(instituteId, data);
        toast({ title: "Tipo de Activo Creado" });
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
    if (!deletingAssetType) return;
    try {
        await deleteAssetType(instituteId, deletingAssetType.id);
        toast({ title: "Tipo de Activo Eliminado" });
        fetchData();
    } catch (error: any) {
        toast({ title: "Error al eliminar", description: "No se puede eliminar un tipo de activo que ya está en uso.", variant: "destructive" });
    } finally {
        setDeletingAssetType(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Catálogo de Activos</CardTitle>
                <CardDescription>
                Gestione los tipos de bienes estandarizados para el inventario de su instituto.
                </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Añadir Tipo de Activo
            </Button>
        </CardHeader>
        <CardContent>
             <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Código Patrimonial</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                        ) : assetTypes.length > 0 ? (
                            assetTypes.map(assetType => (
                                <TableRow key={assetType.id}>
                                    <TableCell className="font-medium">
                                        <p>{assetType.name}</p>
                                        <p className="text-xs text-muted-foreground">{assetType.description}</p>
                                    </TableCell>
                                    <TableCell><Badge variant="secondary">{assetType.code}</Badge></TableCell>
                                    <TableCell>{assetType.category}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(assetType)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingAssetType(assetType)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">No hay tipos de activo registrados.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
             </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingAssetType ? 'Editar' : 'Nuevo'} Tipo de Activo</DialogTitle>
              </DialogHeader>
               <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre del Bien</FormLabel><FormControl><Input {...field} placeholder="Ej: Silla de Escritorio Ergonómica" /></FormControl><FormMessage /></FormItem>)}/>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="code" render={({ field }) => (<FormItem><FormLabel>Código Patrimonial Base</FormLabel><FormControl><Input {...field} placeholder="Ej: S-ESC" /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl><SelectContent>{assetCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        </div>
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción (Opcional)</FormLabel><FormControl><Textarea {...field} placeholder="Cualquier detalle adicional sobre este tipo de bien."/></FormControl><FormMessage /></FormItem>)}/>
                        
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
               </Form>
          </DialogContent>
      </Dialog>
      
       <AlertDialog open={!!deletingAssetType} onOpenChange={(open) => !open && setDeletingAssetType(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará el tipo de activo "{deletingAssetType?.name}". No podrá eliminarlo si ya existen activos de este tipo en el inventario.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingAssetType(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
