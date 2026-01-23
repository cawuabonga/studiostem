"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getSupplyCatalog, updateStock, getSupplyItemHistory } from '@/config/firebase';
import type { SupplyItem, StockHistoryLog } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, History } from 'lucide-react';
import { format } from 'date-fns';

const AddStockDialog = ({
    isOpen,
    onClose,
    item,
    onConfirm
}: {
    isOpen: boolean;
    onClose: () => void;
    item: SupplyItem;
    onConfirm: (quantity: number, notes: string) => Promise<void>;
}) => {
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        const numQuantity = parseInt(quantity, 10);
        if (isNaN(numQuantity) || numQuantity <= 0) {
            alert("Por favor, ingrese una cantidad válida.");
            return;
        }
        setLoading(true);
        await onConfirm(numQuantity, notes);
        setLoading(false);
        onClose();
    };
    
    useEffect(() => {
        if (!isOpen) {
            setQuantity('');
            setNotes('');
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Stock para: {item.name}</DialogTitle>
                    <DialogDescription>
                        Ingrese la cantidad de {item.unitOfMeasure}(s) que están ingresando al almacén.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad a Añadir</Label>
                        <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas (Opcional)</Label>
                        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Compra según O/C N°123" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Añadir al Stock
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const HistoryDialog = ({
    isOpen,
    onClose,
    item,
    history,
    loading
}: {
    isOpen: boolean;
    onClose: () => void;
    item: SupplyItem;
    history: StockHistoryLog[];
    loading: boolean;
}) => {
     return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Historial de Movimientos: {item.name}</DialogTitle>
                </DialogHeader>
                 <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {loading ? <Skeleton className="h-48 w-full"/> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Cambio</TableHead>
                                    <TableHead>Stock Final</TableHead>
                                    <TableHead>Notas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs">{format(log.timestamp.toDate(), 'dd/MM/yy HH:mm')}</TableCell>
                                        <TableCell>{log.userName}</TableCell>
                                        <TableCell className={log.change > 0 ? 'text-green-600' : 'text-red-600'}>{log.change > 0 ? `+${log.change}` : log.change}</TableCell>
                                        <TableCell className="font-bold">{log.newStock}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{log.notes}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
     )
};


export function StockManager() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    
    const [catalog, setCatalog] = useState<SupplyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddStockOpen, setIsAddStockOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SupplyItem | null>(null);
    const [historyLogs, setHistoryLogs] = useState<StockHistoryLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

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
    
    const handleOpenAddStock = (item: SupplyItem) => {
        setSelectedItem(item);
        setIsAddStockOpen(true);
    };

    const handleOpenHistory = async (item: SupplyItem) => {
        if (!instituteId) return;
        setSelectedItem(item);
        setIsHistoryOpen(true);
        setLoadingHistory(true);
        try {
            const logs = await getSupplyItemHistory(instituteId, item.id);
            setHistoryLogs(logs);
        } catch (error) {
             toast({ title: "Error", description: "No se pudo cargar el historial.", variant: "destructive" });
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleConfirmAddStock = async (quantity: number, notes: string) => {
        if (!instituteId || !selectedItem) return;
        try {
            await updateStock(instituteId, selectedItem.id, quantity, notes);
            toast({ title: "Stock Actualizado", description: `Se añadieron ${quantity} ${selectedItem.unitOfMeasure}(s) de ${selectedItem.name}.`});
            fetchData();
        } catch (error: any) {
            toast({ title: "Error al actualizar stock", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Stock de Insumos</CardTitle>
                    <CardDescription>Visualice el inventario y registre la entrada de nuevos suministros.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Insumo</TableHead>
                                    <TableHead>Unidad de Medida</TableHead>
                                    <TableHead>Stock Actual</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                                ) : catalog.length > 0 ? (
                                    catalog.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.unitOfMeasure}</TableCell>
                                            <TableCell className="font-bold text-lg">{item.stock}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                 <Button variant="outline" size="sm" onClick={() => handleOpenHistory(item)}>
                                                    <History className="mr-2 h-4 w-4"/>
                                                    Historial
                                                </Button>
                                                <Button size="sm" onClick={() => handleOpenAddStock(item)}>
                                                    <Plus className="mr-2 h-4 w-4"/>
                                                    Añadir Stock
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">El catálogo de insumos está vacío.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            {selectedItem && (
                <AddStockDialog 
                    isOpen={isAddStockOpen}
                    onClose={() => setIsAddStockOpen(false)}
                    item={selectedItem}
                    onConfirm={handleConfirmAddStock}
                />
            )}

             {selectedItem && (
                <HistoryDialog 
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    item={selectedItem}
                    history={historyLogs}
                    loading={loadingHistory}
                />
             )}
        </div>
    );
}
