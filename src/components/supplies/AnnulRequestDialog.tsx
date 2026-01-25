
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { SupplyRequest } from '@/types';
import { updateSupplyRequestStatus } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AnnulRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: SupplyRequest;
  onConfirm: () => void;
}

export function AnnulRequestDialog({ isOpen, onClose, request, onConfirm }: AnnulRequestDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { instituteId } = useAuth();
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Por favor, ingrese el motivo de la anulación.');
      return;
    }
    if (!instituteId) return;

    setLoading(true);
    try {
        await updateSupplyRequestStatus(instituteId, request.id, 'Anulado', { annulmentReason: reason });
        toast({ title: "Pedido Anulado", description: "El pedido ha sido anulado y el stock ha sido devuelto al inventario." });
        onConfirm();
    } catch (error: any) {
        toast({ title: "Error al Anular", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular Entrega de Pedido: {request.code}</DialogTitle>
          <DialogDescription>
            Esta acción devolverá los insumos al stock y marcará el pedido como anulado.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="annulment-reason" className="font-semibold">
            Motivo de la Anulación
          </Label>
          <Textarea
            id="annulment-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Error en el registro, entrega incorrecta, etc."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
          <Button onClick={handleConfirm} variant="destructive" disabled={loading || !reason}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Anulación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
