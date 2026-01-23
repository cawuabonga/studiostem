

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getSupplyCatalog, addSupplyItem, updateSupplyItem, deleteSupplyItem } from '@/config/firebase';
import type { SupplyItem, SupplyUnitOfMeasure, SupplyCategory } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, PlusCircle, Trash, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const unitsOfMeasure: SupplyUnitOfMeasure[] = ['Unidad', 'Caja', 'Paquete', 'Resma', 'Galón', 'Kilo', 'Metro', 'Litro'];
const categories: SupplyCategory[] = ['Oficina', 'Aseo', 'Bebidas', 'Snacks', 'Accesorios', 'Otro'];

const supplyItemSchema = z.object({
  code: z.string().min(1, 'El código es requerido.'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().optional(),
  unitOfMeasure: z.enum(unitsOfMeasure, { required_error: 'Debe seleccionar una unidad de medida.' }),
  category: z.enum(categories).optional(),
});

type FormValues = z.infer<typeof supplyItemSchema>;

export function SupplyCatalogManager() {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  
  const [catalog, setCatalog] = useState<SupplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<SupplyItem | null>(null);
  
  const form = useForm<FormValues>({ resolver: zodResolver(supplyItemSchema) });

  const fetchData = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedItems = await getSupplyCatalog(instituteId);
      setCatalog(fetchedItems);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el catálogo de insumos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => { fetchData() }, [fetchData]);

  const handleOpenDialog = (item?: SupplyItem) => {
    setEditingItem(item || null);
    form.reset(item || { code: '', name: '', description: '', category: undefined });
    setIsDialogOpen(true);
  };

  const handleSave = async (data: FormValues) => {
    if (!instituteId) return;
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateSupplyItem(instituteId, editingItem.id, data);
        toast({ title: "Insumo Actualizado" });
      } else {
        await addSupplyItem(instituteId, data);
        toast({ title: "Insumo Creado" });
      }
      fetchData();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!instituteId || !deletingItem) return;
    try {
      await deleteSupplyItem(instituteId, deletingItem.id);
      toast({ title: "Insumo Eliminado" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } finally {
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Catálogo de Insumos</CardTitle>
            <CardDescription>Gestione los materiales y suministros disponibles para el personal.</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4"/> Añadir Insumo
          </Button>
        </CardHeader>
        <CardContent>
           <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre del Insumo</TableHead>
                  <TableHead>Unidad de Medida</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={5}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                ) : catalog.length > 0 ? (
                    catalog.map(item => (
                        <TableRow key={item.id}>
                            <TableCell className="font-mono">{item.code}</TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.unitOfMeasure}</TableCell>
                            <TableCell>{item.category || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingItem(item)}><Trash className="h-4 w-4"/></Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No hay insumos en el catálogo. Añada el primero.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
           </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingItem ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
              </DialogHeader>
               <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="code" render={({ field }) => (<FormItem><FormLabel>Código</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción (Opcional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="unitOfMeasure" render={({ field }) => (<FormItem><FormLabel>Unidad de Medida</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..."/></SelectTrigger></FormControl><SelectContent>{unitsOfMeasure.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..."/></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Guardar
                            </Button>
                        </DialogFooter>
                    </form>
               </Form>
          </DialogContent>
      </Dialog>
      
       <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción eliminará "{deletingItem?.name}" del catálogo. No podrá ser solicitado ni gestionado en el stock.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
