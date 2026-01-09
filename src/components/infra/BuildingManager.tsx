
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { getBuildings, addBuilding, updateBuilding, deleteBuilding } from '@/config/firebase';
import type { Building } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';

const buildingSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  code: z.string().optional(),
  location: z.string().optional(),
  floorCount: z.coerce.number().min(0).optional(),
  dimensions: z.object({
    width: z.coerce.number().min(0).optional(),
    length: z.coerce.number().min(0).optional(),
  }).optional(),
});

type FormValues = z.infer<typeof buildingSchema>;

interface BuildingManagerProps {
    instituteId: string;
}

export function BuildingManager({ instituteId }: BuildingManagerProps) {
    const { toast } = useToast();
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
    const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(buildingSchema),
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedData = await getBuildings(instituteId);
            setBuildings(fetchedData);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los edificios.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenDialog = (building?: Building) => {
        setEditingBuilding(building || null);
        form.reset({
            name: building?.name || '',
            code: building?.code || '',
            location: building?.location || '',
            floorCount: building?.floorCount || 0,
            dimensions: {
                width: building?.dimensions?.width || 0,
                length: building?.dimensions?.length || 0,
            }
        });
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setEditingBuilding(null);
    };

    const handleSave = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            if (editingBuilding) {
                await updateBuilding(instituteId, editingBuilding.id, data);
                toast({ title: "Edificio Actualizado" });
            } else {
                await addBuilding(instituteId, data);
                toast({ title: "Edificio Creado" });
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
        if (!deletingBuilding) return;
        try {
            await deleteBuilding(instituteId, deletingBuilding.id);
            toast({ title: "Edificio Eliminado" });
            fetchData();
        } catch (error: any) {
            toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
        } finally {
            setDeletingBuilding(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gestión de Infraestructura</CardTitle>
                        <CardDescription>
                            Administre los edificios, pabellones y su contenido.
                        </CardDescription>
                    </div>
                     <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Edificio
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-40 w-full" />
                    ) : buildings.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {buildings.map(building => (
                                <AccordionItem key={building.id} value={building.id} className="border-b">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex flex-1 items-center justify-between pr-4">
                                            <div className="text-left">
                                                <h3 className="font-semibold text-base">{building.name}</h3>
                                                <p className="text-sm text-muted-foreground">{building.code || 'Sin código'}</p>
                                            </div>
                                            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>Pisos: <Badge variant="secondary">{building.floorCount || 0}</Badge></span>
                                                <span>Ubicación: <Badge variant="secondary">{building.location || 'N/A'}</Badge></span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 bg-muted/30">
                                         <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-semibold">Ambientes en este edificio</h4>
                                            <div>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(building)} className="mr-2">
                                                    <Edit className="mr-2 h-4 w-4" /> Editar Edificio
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => setDeletingBuilding(building)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Edificio
                                                </Button>
                                            </div>
                                        </div>
                                        {/* TODO: Add EnvironmentManager component here */}
                                        <p className="text-muted-foreground text-center py-8">La gestión de ambientes y activos se implementará aquí próximamente.</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-muted-foreground text-center py-10">No hay edificios registrados. ¡Crea el primero para empezar!</p>
                    )}
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBuilding ? 'Editar Edificio' : 'Nuevo Edificio'}</DialogTitle>
                        <DialogDescription>Complete los detalles del edificio o pabellón.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Ej: Pabellón A - Administración" /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="code" render={({ field }) => (<FormItem><FormLabel>Código (Opcional)</FormLabel><FormControl><Input {...field} placeholder="Ej: PAB-A" /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Ubicación (Opcional)</FormLabel><FormControl><Input {...field} placeholder="Ej: Campus Central, Zona Norte" /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="floorCount" render={({ field }) => (<FormItem><FormLabel>Cantidad de Pisos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <div className="grid grid-cols-2 gap-4">
                               <FormField control={form.control} name="dimensions.width" render={({ field }) => (<FormItem><FormLabel>Ancho (m)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                               <FormField control={form.control} name="dimensions.length" render={({ field }) => (<FormItem><FormLabel>Largo (m)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    {editingBuilding ? 'Guardar Cambios' : 'Crear Edificio'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingBuilding} onOpenChange={(open) => !open && setDeletingBuilding(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el edificio "{deletingBuilding?.name}" y todos los ambientes y activos que contiene.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingBuilding(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar todo</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
