
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

interface AnnulPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onConfirm: (paymentId: string, reason: string) => Promise<void>;
}

export function AnnulPaymentDialog({ isOpen, onClose, payment, onConfirm }: AnnulPaymentDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Por favor, ingrese el motivo de la anulación.');
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
          <DialogTitle>Anular Pago Aprobado</DialogTitle>
          <DialogDescription>
            Estás a punto de anular el pago para <span className="font-bold">{payment.payerName}</span> con comprobante <span className="font-bold">{payment.receiptNumber}</span>. Esta acción no se puede deshacer.
            <br />
            Por favor, especifica el motivo de la anulación.
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
            placeholder="Ej: Pago duplicado, error en el monto, etc."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirm} variant="destructive" disabled={loading || !reason}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sí, anular pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
