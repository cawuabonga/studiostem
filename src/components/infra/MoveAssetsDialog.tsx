
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getEnvironmentsForBuilding } from '@/config/firebase';
import type { Building, Environment } from '@/types';
import { Loader2 } from 'lucide-react';

interface MoveAssetsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (targetEnvironment: Environment) => void;
    buildings: Building[];
    instituteId: string;
    isSubmitting: boolean;
    assetCount: number;
}

export function MoveAssetsDialog({
    isOpen,
    onClose,
    onConfirm,
    buildings,
    instituteId,
    isSubmitting,
    assetCount,
}: MoveAssetsDialogProps) {
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [selectedEnvironmentId, setSelectedEnvironmentId] = useState('');
    const [loadingEnvironments, setLoadingEnvironments] = useState(false);

    useEffect(() => {
        if (selectedBuildingId) {
            setLoadingEnvironments(true);
            getEnvironmentsForBuilding(instituteId, selectedBuildingId)
                .then(setEnvironments)
                .catch(console.error)
                .finally(() => setLoadingEnvironments(false));
        } else {
            setEnvironments([]);
        }
        setSelectedEnvironmentId(''); // Reset environment when building changes
    }, [selectedBuildingId, instituteId]);

    const handleConfirm = () => {
        const targetEnvironment = environments.find(e => e.id === selectedEnvironmentId);
        if (targetEnvironment) {
            onConfirm(targetEnvironment);
        }
    };
    
    useEffect(() => {
        // Reset state when dialog opens or closes
        if (!isOpen) {
            setSelectedBuildingId('');
            setSelectedEnvironmentId('');
            setEnvironments([]);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mover Activos</DialogTitle>
                    <DialogDescription>
                        Seleccione el nuevo edificio y ambiente de destino para los {assetCount} activo(s) seleccionado(s).
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="building-select">Edificio de Destino</Label>
                        <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                            <SelectTrigger id="building-select">
                                <SelectValue placeholder="Seleccione un edificio..." />
                            </SelectTrigger>
                            <SelectContent>
                                {buildings.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="environment-select">Ambiente de Destino</Label>
                        <Select
                            value={selectedEnvironmentId}
                            onValueChange={setSelectedEnvironmentId}
                            disabled={!selectedBuildingId || loadingEnvironments}
                        >
                            <SelectTrigger id="environment-select">
                                <SelectValue placeholder={loadingEnvironments ? "Cargando..." : "Seleccione un ambiente..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {environments.map(e => (
                                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                    <Button onClick={handleConfirm} disabled={!selectedEnvironmentId || isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Mover Activos
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

