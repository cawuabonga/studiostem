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
import { updateSupplyRequest } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RejectRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: SupplyRequest;
  onConfirm: () => void;
}

export function RejectRequestDialog({ isOpen, onClose, request, onConfirm }: RejectRequestDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { instituteId } = useAuth();
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Por favor, ingrese el motivo del rechazo.');
      return;
    }
    if (!instituteId) return;

    setLoading(true);
    try {
        await updateSupplyRequest(instituteId, request.id, {
            status: 'Rechazado',
            rejectionReason: reason
        });
        toast({ title: "Pedido Rechazado", description: "El pedido ha sido marcado como rechazado." });
        onConfirm();
    } catch (error) {
        toast({ title: "Error", description: "No se pudo rechazar el pedido.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar Pedido: {request.code}</DialogTitle>
          <DialogDescription>
            Por favor, especifica el motivo del rechazo para el pedido de <span className="font-bold">{request.requesterName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="rejection-reason" className="font-semibold">
            Motivo del Rechazo
          </Label>
          <Textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Stock insuficiente, pedido fuera de fecha, etc."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
          <Button onClick={handleConfirm} variant="destructive" disabled={loading || !reason}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Rechazo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
