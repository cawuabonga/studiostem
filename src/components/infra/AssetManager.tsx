

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAssetsForEnvironment, addAsset, updateAsset, deleteAsset, getAssetHistory, getAssetTypes } from '@/config/firebase';
import type { Asset, AssetHistoryLog, AssetType } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Edit2, Trash2, History, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
import { es } from 'date-fns/locale';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Label } from '@/components/ui/label';
import { Timestamp } from 'firebase/firestore';

const assetStatuses = ['Operativo', 'En Mantenimiento', 'De Baja'];

const assetSchema = z.object({
  assetTypeId: z.string().min(1, 'Debe seleccionar un tipo de activo del catálogo.'),
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

const HistoryDialog = ({ logs, open, onOpenChange }: { logs: AssetHistoryLog[], open: boolean, onOpenChange: (open: boolean) => void }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Historial de Cambios del Activo</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <ul className="space-y-4">
                        {logs.map(log => (
                            <li key={log.id} className="flex items-start gap-4">
                                <div className="text-xs text-muted-foreground text-center">
                                    <p>{format(log.timestamp.toDate(), 'dd/MM/yy')}</p>
                                    <p>{format(log.timestamp.toDate(), 'HH:mm')}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{log.userName}</p>
                                    <p className="text-sm text-muted-foreground">{log.details}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    )
};


export function AssetManager({ instituteId, buildingId, environmentId }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<AssetHistoryLog[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { toast } = useToast();
  
  // State for the combobox
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedAssets, fetchedAssetTypes] = await Promise.all([
          getAssetsForEnvironment(instituteId, buildingId, environmentId),
          getAssetTypes(instituteId),
      ]);
      setAssets(fetchedAssets);
      setAssetTypes(fetchedAssetTypes);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, buildingId, environmentId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const selectedAssetTypeId = form.watch('assetTypeId');
  const selectedAssetTypeDetails = useMemo(() => assetTypes.find(t => t.id === selectedAssetTypeId), [assetTypes, selectedAssetTypeId]);
  
  const generatedAssetCode = useMemo(() => {
    if (!selectedAssetTypeDetails) return '';
    const nextNumber = (selectedAssetTypeDetails.lastAssignedNumber || 0) + 1;
    return `${selectedAssetTypeDetails.code}-${String(nextNumber).padStart(4, '0')}`;
  }, [selectedAssetTypeDetails]);


  const handleOpenForm = (asset?: Asset) => {
    setSelectedAsset(asset || null);
    form.reset({
      assetTypeId: asset?.assetTypeId || '',
      status: asset?.status || 'Operativo',
      acquisitionDate: asset?.acquisitionDate?.toDate(),
      notes: asset?.notes || '',
    });
    setIsFormOpen(true);
  };
  
  const handleOpenHistory = async (asset: Asset) => {
    try {
        const logs = await getAssetHistory(instituteId, buildingId, environmentId, asset.id);
        setHistoryLogs(logs);
        setIsHistoryOpen(true);
    } catch (error) {
         toast({ title: "Error", description: "No se pudo cargar el historial del activo.", variant: "destructive" });
    }
  };

  const handleCloseForm = (updated?: boolean) => {
    setIsFormOpen(false);
    setSelectedAsset(null);
    if(updated) {
        fetchData();
    }
  };

  const onSubmit = async (data: AssetFormValues) => {
    setIsSubmitting(true);
    try {
        const selectedAssetType = assetTypes.find(t => t.id === data.assetTypeId);
        if (!selectedAssetType) {
            throw new Error("El tipo de activo seleccionado no es válido.");
        }
        
        if (selectedAsset) {
            // Edit logic
            await updateAsset(instituteId, buildingId, environmentId, selectedAsset.id, {
                ...data,
                name: selectedAssetType.name,
                type: selectedAssetType.category
            });
            toast({ title: "Activo Actualizado" });
        } else {
            // Create logic
            const newAssetId = await addAsset(instituteId, buildingId, environmentId, data.assetTypeId, {
                status: data.status,
                acquisitionDate: data.acquisitionDate ? Timestamp.fromDate(data.acquisitionDate) : undefined,
                notes: data.notes
            });
             toast({ title: "Activo Añadido", description: `El nuevo activo ha sido registrado con el código: ${newAssetId}` });
        }
        handleCloseForm(true);
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
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
                        <TableHead>Código</TableHead>
                        <TableHead>Tipo</TableHead>
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
                            <TableCell>{asset.status}</TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenHistory(asset)}><History className="mr-2 h-4 w-4" /> Ver Historial</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleOpenForm(asset)}><Edit2 className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedAsset(asset); setIsDeleteDialogOpen(true);}}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">No hay activos registrados en este ambiente.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
      
        <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedAsset ? 'Editar Activo' : 'Nuevo Activo'}</DialogTitle>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="assetTypeId" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Tipo de Activo</FormLabel>
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                        disabled={!!selectedAsset}
                                    >
                                        {field.value ? assetTypes.find((t) => t.id === field.value)?.name : "Seleccione un tipo del catálogo..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                    <CommandInput placeholder="Buscar tipo de activo..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontró el tipo de activo.</CommandEmpty>
                                        <CommandGroup>
                                        {assetTypes.map((t) => (
                                            <CommandItem
                                            value={t.name}
                                            key={t.id}
                                            onSelect={() => {
                                                form.setValue("assetTypeId", t.id)
                                                setComboboxOpen(false)
                                            }}
                                            >
                                            <Check className={cn("mr-2 h-4 w-4", t.id === field.value ? "opacity-100" : "opacity-0")} />
                                            {t.name}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                    </Command>
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <Label>Categoría</Label>
                                <Input value={selectedAssetTypeDetails?.category || ''} disabled className="mt-2" />
                            </div>
                            <div>
                                <Label>Código a Generar</Label>
                                <Input value={selectedAsset ? selectedAsset.codeOrSerial : generatedAssetCode} disabled className="mt-2 font-mono" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>{assetStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="acquisitionDate" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel className="mb-2">Fecha de Adquisición</FormLabel>
                                <Popover><PopoverTrigger asChild>
                                    <FormControl>
                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus /></PopoverContent></Popover>
                                <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                        
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem><FormLabel>Notas (Opcional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {selectedAsset ? 'Guardar Cambios' : 'Añadir Activo'}
                            </Button>
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

        <HistoryDialog logs={historyLogs} open={isHistoryOpen} onOpenChange={setIsHistoryOpen} />
    </div>
  );
}
