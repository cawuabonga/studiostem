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
import type { SupplyRequest } from '@/types';
import { updateSupplyRequestStatus } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DeliverRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: SupplyRequest;
  onConfirm: () => void;
}

export function DeliverRequestDialog({ isOpen, onClose, request, onConfirm }: DeliverRequestDialogProps) {
  const [pecosaCode, setPecosaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { instituteId } = useAuth();
  const { toast } = useToast();

  const handleConfirm = async () => {
    // PECOSA code is optional
    if (!instituteId) return;

    setLoading(true);
    try {
        await updateSupplyRequestStatus(instituteId, request.id, 'Entregado', { pecosaCode: pecosaCode || undefined });
        toast({ title: "Pedido Entregado", description: "El stock ha sido descontado y el pedido marcado como entregado." });
        onConfirm();
    } catch (error: any) {
        toast({ title: "Error en la Entrega", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Entrega (PECOSA)</DialogTitle>
          <DialogDescription>
            Confirme la entrega para el pedido <span className="font-bold">{request.code}</span>. Puede registrar un código PECOSA si aplica.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="pecosa-code" className="font-semibold">
            Código PECOSA (Opcional)
          </Label>
          <Input
            id="pecosa-code"
            value={pecosaCode}
            onChange={(e) => setPecosaCode(e.target.value)}
            placeholder="Ej: PECOSA-2024-050"
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
