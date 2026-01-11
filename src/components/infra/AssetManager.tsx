

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAssetsForEnvironment, addAsset, updateAsset, deleteAsset, getAssetHistory } from '@/config/firebase';
import type { Asset, AssetHistoryLog } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Edit2, Trash2, History } from 'lucide-react';
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
import { es } from 'date-fns/locale';

const assetStatuses = ['Operativo', 'En Mantenimiento', 'De Baja'];

// El schema se simplificará, ya que muchos campos se autocompletarán desde el catálogo
const assetSchema = z.object({
  assetTypeId: z.string().min(1, 'Debe seleccionar un tipo de activo del catálogo.'),
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
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<AssetHistoryLog[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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
    // Este formulario se simplificará en la Fase 2 para usar el catálogo.
    // Por ahora, lo mantenemos como está, pero la lógica de guardado cambiará.
    form.reset({
      assetTypeId: asset?.assetTypeId || '',
      quantity: asset?.quantity || 1,
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
      toast({ title: "Próximamente", description: "La creación y edición se integrarán con el catálogo en la siguiente fase." });
      return;
    // Lógica futura que usará el catálogo
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
                            <TableCell>{asset.code}</TableCell>
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
      
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedAsset ? 'Editar Activo' : 'Nuevo Activo'}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground py-8 text-center">
                    La creación y edición de activos se realizará a través del nuevo Catálogo de Activos en la siguiente fase de implementación.
                </p>
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
