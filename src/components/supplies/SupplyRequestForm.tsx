
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getSupplyCatalog } from '@/config/firebase';
import type { SupplyItem, SupplyRequestItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { PlusCircle, Trash2, Send, Loader2 } from 'lucide-react';
import { createSupplyRequest } from '@/config/firebase';
import { useRouter } from 'next/navigation';

export function SupplyRequestForm() {
    const { instituteId, user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const [catalog, setCatalog] = useState<SupplyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [requestItems, setRequestItems] = useState<Map<string, SupplyRequestItem>>(new Map());
    
    const [searchTerm, setSearchTerm] = useState('');

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

    const handleAddItem = (item: SupplyItem) => {
        if (requestItems.has(item.id)) return;
        const newItem: SupplyRequestItem = {
            itemId: item.id,
            name: item.name,
            unitOfMeasure: item.unitOfMeasure,
            requestedQuantity: 1,
        };
        const newItems = new Map(requestItems);
        newItems.set(item.id, newItem);
        setRequestItems(newItems);
    };

    const handleRemoveItem = (itemId: string) => {
        const newItems = new Map(requestItems);
        newItems.delete(itemId);
        setRequestItems(newItems);
    };

    const handleQuantityChange = (itemId: string, quantity: number) => {
        const item = requestItems.get(itemId);
        if (item) {
            const newItems = new Map(requestItems);
            newItems.set(itemId, { ...item, requestedQuantity: Math.max(1, quantity) });
            setRequestItems(newItems);
        }
    };
    
    const handleSubmitRequest = async () => {
        if (requestItems.size === 0 || !instituteId || !user?.documentId) {
            toast({ title: "Pedido Vacío", description: "Añada al menos un insumo a su pedido.", variant: "destructive"});
            return;
        }
        setIsSubmitting(true);
        try {
            await createSupplyRequest(instituteId, {
                requesterId: user.documentId,
                requesterName: user.displayName || 'Usuario desconocido',
                requesterAuthUid: user.uid,
                items: Array.from(requestItems.values())
            });
            toast({ title: "Pedido Enviado", description: "Su solicitud ha sido enviada para aprobación." });
            router.push('/dashboard/mis-pedidos');
        } catch (error: any) {
            toast({ title: "Error al Enviar", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const filteredCatalog = catalog.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) && !requestItems.has(item.id)
    );

    const requestedItemsArray = Array.from(requestItems.values());

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {/* Left Panel: Available Items */}
            <div>
                <h3 className="text-lg font-semibold mb-2">Catálogo de Insumos Disponibles</h3>
                 <Input 
                    placeholder="Buscar insumo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                />
                <div className="rounded-md border max-h-[60vh] overflow-y-auto">
                    {loading ? <Skeleton className="h-48 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Insumo</TableHead>
                                    <TableHead>Unidad</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCatalog.length > 0 ? filteredCatalog.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.unitOfMeasure}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" onClick={() => handleAddItem(item)}>
                                                <PlusCircle className="mr-2 h-4 w-4"/> Añadir
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={3} className="h-24 text-center">No se encontraron insumos.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Right Panel: Current Request */}
             <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Mi Pedido</h3>
                     <Button onClick={handleSubmitRequest} disabled={isSubmitting || requestItems.size === 0}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                        Enviar Pedido
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Añada insumos del catálogo a la izquierda y ajuste las cantidades.</p>
                <div className="rounded-md border max-h-[60vh] overflow-y-auto">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Insumo</TableHead>
                                <TableHead className="w-[120px]">Cantidad</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requestedItemsArray.length > 0 ? requestedItemsArray.map(item => (
                                <TableRow key={item.itemId}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number" 
                                            min="1"
                                            value={item.requestedQuantity}
                                            onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value, 10))}
                                            className="h-8"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => handleRemoveItem(item.itemId)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={3} className="h-24 text-center">Su pedido está vacío.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
