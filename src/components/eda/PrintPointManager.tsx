
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getPrintPoints, savePrintPoint, deletePrintPoint } from '@/services/eda-service';
import type { PrintPoint, PrintPointStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter, 
    DialogClose 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage,
    FormDescription
} from '@/components/ui/form';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Loader2, 
    PlusCircle, 
    Trash, 
    Edit, 
    Monitor, 
    Circle, 
    MapPin,
    Printer,
    ImageIcon,
    Clock,
    Keyboard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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
} from "@/components/ui/alert-dialog";

const pointSchema = z.object({
  pointId: z.string().min(1, 'El identificador técnico es requerido (ej: EDA-01).'),
  name: z.string().min(3, 'El nombre amigable debe tener al menos 3 caracteres.'),
  location: z.string().min(3, 'La ubicación física es requerida.'),
  status: z.enum(['Online', 'Offline', 'Mantenimiento'] as const),
  backgroundImage: z.instanceof(FileList).optional(),
  allowManualLogin: z.boolean().default(false),
  inactivityTimeout: z.coerce.number().min(10).max(300).default(50),
});

type FormValues = z.infer<typeof pointSchema>;

export function PrintPointManager() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [points, setPoints] = useState<PrintPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPoint, setEditingPoint] = useState<PrintPoint | null>(null);
    const [deletingPoint, setDeletingPoint] = useState<PrintPoint | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(pointSchema),
        defaultValues: { 
            status: 'Offline',
            allowManualLogin: false,
            inactivityTimeout: 50
        }
    });

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const data = await getPrintPoints(instituteId);
            setPoints(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los puntos de impresión.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenDialog = (point?: PrintPoint) => {
        setEditingPoint(point || null);
        form.reset({
            pointId: point?.pointId || '',
            name: point?.name || '',
            location: point?.location || '',
            status: point?.status || 'Offline',
            backgroundImage: undefined,
            allowManualLogin: point?.allowManualLogin ?? false,
            inactivityTimeout: point?.inactivityTimeout ?? 50
        });
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: FormValues) => {
        if (!instituteId) return;
        setIsSubmitting(true);
        try {
            const { backgroundImage, ...rest } = data;
            const imageFile = backgroundImage?.[0];
            
            await savePrintPoint(instituteId, { ...rest, instituteId }, editingPoint?.id, imageFile);
            toast({ title: editingPoint ? "Punto Actualizado" : "Punto Registrado" });
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!instituteId || !deletingPoint) return;
        try {
            await deletePrintPoint(instituteId, deletingPoint.id);
            toast({ title: "Punto Eliminado" });
            fetchData();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        } finally {
            setDeletingPoint(null);
        }
    };

    const getStatusIcon = (status: PrintPointStatus) => {
        switch (status) {
            case 'Online': return <Circle className="h-2 w-2 fill-green-500 text-green-500" />;
            case 'Offline': return <Circle className="h-2 w-2 fill-slate-400 text-slate-400" />;
            case 'Mantenimiento': return <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenDialog()} className="font-black rounded-xl h-11 px-6 shadow-lg">
                    <PlusCircle className="mr-2 h-4 w-4" /> REGISTRAR PUNTO (POINT PRINT)
                </Button>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full rounded-2xl" />
                        <Skeleton className="h-20 w-full rounded-2xl" />
                    </div>
                ) : points.length > 0 ? (
                    <div className="rounded-3xl border shadow-sm overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="font-black text-[10px] uppercase pl-8 py-4">Identidad y Estado</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase">Configuración Kiosko</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase text-center">Fondo</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase">Ubicación</TableHead>
                                    <TableHead className="text-right font-black text-[10px] uppercase pr-8">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {points.map(point => (
                                    <TableRow key={point.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-3 rounded-2xl shadow-sm transition-transform group-hover:scale-110",
                                                    point.status === 'Online' ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
                                                )}>
                                                    <Monitor className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-tight">{point.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[9px] font-mono font-bold h-4 px-1.5 uppercase">
                                                            ID: {point.pointId}
                                                        </Badge>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground">
                                                            {getStatusIcon(point.status)} {point.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Keyboard className={cn("h-3.5 w-3.5", point.allowManualLogin ? "text-primary" : "text-slate-300")} />
                                                    <span className="text-[10px] font-bold uppercase">{point.allowManualLogin ? "Login DNI Activo" : "Solo RFID"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Timeout: {point.inactivityTimeout || 50}s</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {point.backgroundImageUrl ? (
                                                <div className="relative h-8 w-14 mx-auto rounded-md overflow-hidden border shadow-inner">
                                                    <Image src={point.backgroundImageUrl} alt="Fondo" fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <Badge variant="secondary" className="text-[8px] font-black uppercase">Color Base</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                                {point.location}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10" onClick={() => handleOpenDialog(point)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => setDeletingPoint(point)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="py-24 text-center text-muted-foreground border-2 border-dashed rounded-[3rem] bg-muted/5">
                        <Printer className="h-16 w-16 mx-auto mb-4 opacity-10" />
                        <p className="text-xl font-black uppercase tracking-widest">Sin puntos registrados</p>
                        <p className="text-sm mt-2">Comience registrando su primer terminal Point Print.</p>
                    </div>
                )}
            </div>

            {/* Dialog: Registro/Edición */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md rounded-[2.5rem] shadow-2xl p-0 overflow-hidden border-none">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight leading-none">
                            {editingPoint ? 'Editar Point Print' : 'Nuevo Point Print'}
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 font-medium">Configure los parámetros técnicos y de seguridad del terminal.</DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem className="col-span-2"><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Nombre del Punto</FormLabel><FormControl><Input placeholder="Ej: Pasillo Principal" {...field} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="pointId" render={({ field }) => (
                                    <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Hard-ID</FormLabel><FormControl><Input placeholder="Ej: EDA-01" {...field} className="h-11 rounded-xl font-mono uppercase" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Estado</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Online">Operativo</SelectItem>
                                                <SelectItem value="Offline">Fuera de línea</SelectItem>
                                                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}/>
                            </div>
                            
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Ubicación Física</FormLabel><FormControl><Input placeholder="Ej: Biblioteca - 2do Piso" {...field} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>
                            )}/>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-black text-[10px] uppercase tracking-widest text-primary">Ajustes del Kiosko</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField control={form.control} name="allowManualLogin" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-3 bg-muted/30">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-xs font-bold">Login Manual (DNI)</FormLabel>
                                                <FormDescription className="text-[10px]">Permite ingresar el DNI por teclado en pantalla.</FormDescription>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )}/>
                                    <FormField control={form.control} name="inactivityTimeout" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold">Tiempo de Inactividad (seg.)</FormLabel>
                                            <FormControl><Input type="number" {...field} className="h-10 rounded-xl" /></FormControl>
                                            <FormDescription className="text-[10px]">Segundos antes de cerrar sesión automáticamente.</FormDescription>
                                        </FormItem>
                                    )}/>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" /> Imagen de Fondo (Kiosko)
                                </FormLabel>
                                {editingPoint?.backgroundImageUrl && (
                                    <div className="relative h-24 w-full rounded-xl overflow-hidden border-2 border-dashed border-primary/10">
                                        <Image src={editingPoint.backgroundImageUrl} alt="Actual" fill className="object-cover opacity-60" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                            <Badge variant="secondary" className="font-black text-[8px]">FONDO ACTUAL</Badge>
                                        </div>
                                    </div>
                                )}
                                <FormField control={form.control} name="backgroundImage" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input type="file" accept="image/*" {...form.register('backgroundImage')} className="h-10 text-xs bg-muted/50 rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>

                            <DialogFooter className="pt-4 flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold rounded-xl flex-1 h-12">CANCELAR</Button>
                                <Button type="submit" disabled={isSubmitting} className="font-black rounded-xl flex-1 h-12 shadow-xl shadow-primary/20">
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <SaveIcon className="h-5 w-5 mr-2" />}
                                    {editingPoint ? 'GUARDAR CAMBIOS' : 'REGISTRAR PUNTO'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingPoint} onOpenChange={(open) => !open && setDeletingPoint(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase text-primary">¿Eliminar Punto de Impresión?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-slate-600">Esta acción es irreversible y el dispositivo con ID <strong>{deletingPoint?.pointId}</strong> dejará de tener acceso al servidor EDA.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold h-11">CANCELAR</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black h-11">ELIMINAR PERMANENTE</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Helpers
function SaveIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}
