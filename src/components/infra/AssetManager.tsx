
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAssetsForEnvironment, addAsset, updateAsset, deleteAsset, getAssetHistory, getAssetTypes, getAssetTypeById } from '@/config/firebase';
import type { Asset, AssetHistoryLog, AssetType, AssetClass } from '@/types';
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
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';

const assetStatuses = ['Operativo', 'En Mantenimiento', 'De Baja'];

// Base schema
const assetSchema = z.object({
  assetTypeId: z.string().min(1, 'Debe seleccionar un tipo de activo del catálogo.'),
  status: z.enum(assetStatuses as [string, ...string[]], { required_error: 'Debe seleccionar un estado.' }),
  acquisitionDate: z.date().optional(),
  notes: z.string().optional(),
  characteristics: z.object({
    marca: z.string().optional(),
    modelo: z.string().optional(),
    tipo: z.string().optional(),
    color: z.string().optional(),
    numero_serie: z.string().optional(),
    numero_motor: z.string().optional(),
    numero_chasis: z.string().optional(),
    dimension: z.string().optional(),
    raza: z.string().optional(),
    especie: z.string().optional(),
    placa_matricula: z.string().optional(),
    edad: z.string().optional(),
    pais: z.string().optional(),
    año_fabricacion: z.string().optional(),
    otros: z.string().optional(),
  }).optional(),
});


type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetManagerProps {
    instituteId: string;
    buildingId: string;
    environmentId: string;
}

const allCharacteristicsFields = [
    "marca", "modelo", "tipo", "color", "numero_serie", "numero_motor", "numero_chasis", "dimension", "raza", "especie", "placa_matricula", "edad", "pais", "año_fabricacion", "otros"
];


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
  
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAssetTypeDetails, setSelectedAssetTypeDetails] = useState<AssetType | null>(null);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: { characteristics: {} }
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedAssets = await getAssetsForEnvironment(instituteId, buildingId, environmentId)
      setAssets(fetchedAssets);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, buildingId, environmentId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
        if (instituteId && comboboxOpen) {
            try {
                const fetchedAssetTypes = await getAssetTypes(instituteId, { search: search.toUpperCase(), limit: 100 });
                setAssetTypes(fetchedAssetTypes);
            } catch (error) {
                console.error("Error searching asset types:", error);
            }
        }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, instituteId, comboboxOpen]);

  const selectedAssetTypeId = form.watch('assetTypeId');
  
  useEffect(() => {
    const fetchDetails = async () => {
        if (selectedAssetTypeId) {
            const details = await getAssetTypeById(instituteId, selectedAssetTypeId);
            setSelectedAssetTypeDetails(details);
        } else {
            setSelectedAssetTypeDetails(null);
        }
    }
    fetchDetails();
  }, [selectedAssetTypeId, instituteId])
  
  const nextAssetCode = useMemo(() => {
    if (!selectedAssetTypeDetails) return '';
    const newNumber = (selectedAssetTypeDetails.lastAssignedNumber || 0) + 1;
    return `${selectedAssetTypeDetails.patrimonialCode}-${String(newNumber).padStart(4, '0')}`;
  }, [selectedAssetTypeDetails]);


  const handleOpenForm = async (asset?: Asset) => {
    setSelectedAsset(asset || null);
    if (asset) {
        // If editing, fetch the specific asset type to pre-populate everything
        const details = await getAssetTypeById(instituteId, asset.assetTypeId);
        setSelectedAssetTypeDetails(details);
        setSearch(details?.name || '');
        form.reset({
            assetTypeId: asset.assetTypeId,
            status: asset.status,
            acquisitionDate: asset.acquisitionDate?.toDate(),
            notes: asset.notes || '',
            characteristics: asset.characteristics || {},
        });
    } else {
        // If new, reset everything
        setSelectedAssetTypeDetails(null);
        setSearch('');
        form.reset({
            assetTypeId: '',
            status: 'Operativo',
            acquisitionDate: undefined,
            notes: '',
            characteristics: {},
        });
    }
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
    setSearch('');
    if(updated) {
        fetchData();
    }
  };

  const onSubmit = async (data: AssetFormValues) => {
    setIsSubmitting(true);
    try {
        if (!selectedAssetTypeDetails && !selectedAsset) {
            throw new Error("El tipo de activo seleccionado no es válido o no se encontró.");
        }
        
        const finalAssetTypeDetails = selectedAssetTypeDetails || await getAssetTypeById(instituteId, selectedAsset!.assetTypeId);
        if (!finalAssetTypeDetails) {
            throw new Error("No se pudieron cargar los detalles del tipo de activo.");
        }

        // Clean characteristics object to remove any keys with undefined, null or empty string values.
        const cleanedCharacteristics = data.characteristics ? Object.fromEntries(
            Object.entries(data.characteristics).filter(([, value]) => value != null && value !== '')
        ) : {};
        
        const dataToSave: Partial<Omit<Asset, 'id' | 'name' | 'type' | 'codeOrSerial'>> = {
            assetTypeId: data.assetTypeId,
            status: data.status,
            notes: data.notes || '',
            characteristics: cleanedCharacteristics,
        };
        
        if (data.acquisitionDate) {
            dataToSave.acquisitionDate = Timestamp.fromDate(data.acquisitionDate);
        }

        if (selectedAsset) {
            await updateAsset(instituteId, buildingId, environmentId, selectedAsset.id, {
                ...dataToSave,
                name: finalAssetTypeDetails.name,
                type: finalAssetTypeDetails.class,
            });
            toast({ title: "Activo Actualizado" });
        } else {
            const newAssetId = await addAsset(instituteId, buildingId, environmentId, data.assetTypeId, dataToSave as Partial<Omit<Asset, 'id' | 'name' | 'type' | 'codeOrSerial'>>);
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
                        <TableHead>Denominación</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Clase</TableHead>
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
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
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
            <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{selectedAsset ? 'Editar Activo' : 'Nuevo Activo'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="col-span-1 lg:col-span-2">
                                    <FormField control={form.control} name="assetTypeId" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Tipo de Activo (Bien del Catálogo)</FormLabel>
                                            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")} disabled={!!selectedAsset}>
                                                    <span className="truncate">{selectedAssetTypeDetails?.name || selectedAsset?.name || "Seleccione un tipo del catálogo..."}</span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command><CommandInput placeholder="Buscar por código o nombre..." onValueChange={setSearch} /><CommandList><CommandEmpty>No se encontraron resultados.</CommandEmpty><CommandGroup>
                                                    {assetTypes.map((t) => (<CommandItem value={t.name} key={t.id} onSelect={() => { form.setValue("assetTypeId", t.id); setSearch(t.name); setComboboxOpen(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", t.id === field.value ? "opacity-100" : "opacity-0")} />{t.name}</CommandItem>))}
                                                </CommandGroup></CommandList></Command>
                                            </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </div>
                                <div>
                                    <Label>Clase</Label>
                                    <Input value={selectedAssetTypeDetails?.class || selectedAsset?.type || ''} disabled className="mt-2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Código a Generar</Label>
                                    <Input value={selectedAsset ? selectedAsset.codeOrSerial : nextAssetCode} disabled className="mt-2 font-mono" />
                                </div>
                                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{assetStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="acquisitionDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel className="mb-2">Fecha de Adquisición</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} captionLayout="dropdown-buttons" fromYear={1990} toYear={new Date().getFullYear()} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                            </div>
                            <Separator />
                            <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="col-span-12 lg:col-span-8">
                                    <div className="space-y-2">
                                        <Label className="font-medium">Características Específicas</Label>
                                        <div className="rounded-md border bg-muted/30 p-4 mt-2">
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                {allCharacteristicsFields.map(fieldName => (<FormField key={fieldName} control={form.control} name={`characteristics.${fieldName}` as any} render={({ field }) => (<FormItem><FormLabel className="capitalize text-xs">{fieldName.replace(/_/g, ' ')}</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)}/>))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-12 lg:col-span-4">
                                    <div className="space-y-2 h-full flex flex-col">
                                        <Label className="font-medium">Notas (Opcional)</Label>
                                        <Card className="flex-grow mt-2">
                                            <CardContent className="p-0 h-full">
                                                <FormField control={form.control} name="notes" render={({ field }) => (
                                                    <FormItem className="h-full">
                                                        <FormControl>
                                                            <Textarea {...field} value={field.value || ''} className="h-full min-h-[160px] border-0 focus-visible:ring-0 resize-none" placeholder="Añadir observaciones..."/>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}/>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 mt-auto flex-shrink-0">
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
