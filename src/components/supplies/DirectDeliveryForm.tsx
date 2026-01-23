"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getSupplyCatalog, getStaffProfiles, updateStock } from '@/config/firebase';
import type { SupplyItem, RequestedSupplyItem, StaffProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { PlusCircle, Trash2, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function DirectDeliveryForm() {
    const { instituteId, user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [catalog, setCatalog] = useState<SupplyItem[]>([]);
    const [allStaff, setAllStaff] = useState<StaffProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [deliveryItems, setDeliveryItems] = useState<Map<string, RequestedSupplyItem>>(new Map());
    const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
    
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [fetchedItems, fetchedStaff] = await Promise.all([
                getSupplyCatalog(instituteId),
                getStaffProfiles(instituteId)
            ]);
            setCatalog(fetchedItems);
            setAllStaff(fetchedStaff);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar el catálogo o el personal.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => { fetchData() }, [fetchData]);

    const handleAddItem = (item: SupplyItem) => {
        if (deliveryItems.has(item.id)) return;
        const newItem: RequestedSupplyItem = {
            itemId: item.id,
            name: item.name,
            unitOfMeasure: item.unitOfMeasure,
            quantity: 1
        };
        const newItems = new Map(deliveryItems);
        newItems.set(item.id, newItem);
        setDeliveryItems(newItems);
    };

    const handleRemoveItem = (itemId: string) => {
        const newItems = new Map(deliveryItems);
        newItems.delete(itemId);
        setDeliveryItems(newItems);
    };

    const handleQuantityChange = (itemId: string, quantity: number) => {
        const item = deliveryItems.get(itemId);
        if (item) {
            const newItems = new Map(deliveryItems);
            newItems.set(itemId, { ...item, quantity: Math.max(1, quantity) });
            setDeliveryItems(newItems);
        }
    };
    
    const handleRegisterDelivery = async () => {
        if (deliveryItems.size === 0 || !selectedStaff || !instituteId) {
            toast({ title: "Datos Incompletos", description: "Seleccione un personal y al menos un insumo.", variant: "destructive"});
            return;
        }
        setIsSubmitting(true);
        try {
            for (const item of deliveryItems.values()) {
                await updateStock(instituteId, item.itemId, -item.quantity, `Entrega directa a ${selectedStaff.displayName}`);
            }
            toast({ title: "Entrega Registrada", description: "El stock ha sido actualizado." });
            router.push('/dashboard/gestion-administrativa/abastecimiento/stock');
        } catch (error: any) {
            toast({ title: "Error al Registrar", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const filteredCatalog = catalog.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) && !deliveryItems.has(item.id)
    );

    const deliveryItemsArray = Array.from(deliveryItems.values());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Registrar Entrega Directa</CardTitle>
                <CardDescription>
                    Seleccione al personal que recibe los insumos y luego añada los artículos del catálogo que se están entregando.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="max-w-sm space-y-2">
                     <label className="font-medium text-sm">Personal que recibe</label>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                <span className="truncate">{selectedStaff?.displayName || "Seleccione un personal..."}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar personal..." />
                                <CommandList>
                                <CommandEmpty>No se encontró personal.</CommandEmpty>
                                <CommandGroup>
                                    {allStaff.map(staff => (
                                        <CommandItem
                                            key={staff.documentId}
                                            value={staff.displayName}
                                            onSelect={() => {
                                                setSelectedStaff(staff);
                                                setPopoverOpen(false);
                                            }}
                                        >
                                             <Check className={cn("mr-2 h-4 w-4", selectedStaff?.documentId === staff.documentId ? "opacity-100" : "opacity-0")} />
                                            {staff.displayName}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left: Available */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Catálogo</h3>
                        <Input placeholder="Buscar insumo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-4" />
                        <div className="rounded-md border max-h-[60vh] overflow-y-auto">
                            {loading ? <Skeleton className="h-48 w-full" /> : (
                                <Table>
                                    <TableBody>
                                        {filteredCatalog.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="outline" onClick={() => handleAddItem(item)}>Añadir</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                    {/* Right: To Deliver */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Insumos a Entregar</h3>
                        <div className="rounded-md border max-h-[60vh] overflow-y-auto">
                            <Table>
                                <TableBody>
                                    {deliveryItemsArray.map(item => (
                                        <TableRow key={item.itemId}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell className="w-[100px]">
                                                <Input type="number" min="1" value={item.quantity} onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value, 10))} className="h-8"/>
                                            </TableCell>
                                            <TableCell className="text-right w-[50px]">
                                                <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => handleRemoveItem(item.itemId)}><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {deliveryItemsArray.length === 0 && <TableRow><TableCell colSpan={3} className="h-24 text-center">Añada insumos a la entrega.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleRegisterDelivery} disabled={isSubmitting || deliveryItems.size === 0 || !selectedStaff}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                        Registrar Entrega
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
