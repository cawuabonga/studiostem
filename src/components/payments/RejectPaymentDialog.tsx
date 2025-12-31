

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
import type { Payment } from '@/types';

interface RejectPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onConfirm: (paymentId: string, reason: string) => Promise<void>;
}

export function RejectPaymentDialog({ isOpen, onClose, payment, onConfirm }: RejectPaymentDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Por favor, ingrese el motivo del rechazo.');
      return;
    }
    setLoading(true);
    await onConfirm(payment.id, reason);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar Pago</DialogTitle>
          <DialogDescription>
            Estás a punto de rechazar el pago para <span className="font-bold">{payment.payerName}</span>. Por favor, especifica el motivo para que la persona pueda corregirlo.
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
            placeholder="Ej: La imagen del voucher es ilegible, el número de operación no coincide, etc."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirm} variant="destructive" disabled={loading || !reason}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rechazar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
