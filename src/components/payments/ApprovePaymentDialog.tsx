
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Payment } from '@/types';

interface ApprovePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onConfirm: (paymentId: string, receiptNumber: string) => Promise<void>;
}

export function ApprovePaymentDialog({ isOpen, onClose, payment, onConfirm }: ApprovePaymentDialogProps) {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!receiptNumber.trim()) {
      // Basic validation, can be improved with a form library if needed
      alert('Por favor, ingrese el número de comprobante físico.');
      return;
    }
    setLoading(true);
    await onConfirm(payment.id, receiptNumber);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprobar Pago y Asignar Comprobante</DialogTitle>
          <DialogDescription>
            Estás a punto de aprobar el pago de <span className="font-bold">S/ {payment.amount.toFixed(2)}</span> por el concepto de <span className="font-bold">"{payment.concept}"</span> para el estudiante <span className="font-bold">{payment.studentName}</span>.
            <br />
            Para continuar, ingresa el número del comprobante de pago físico que se le entregará al estudiante.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="receipt-number" className="font-semibold">
            Número de Comprobante Físico
          </Label>
          <Input
            id="receipt-number"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            placeholder="Ej: B001-0012345"
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={loading || !receiptNumber}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aprobar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
