"use client";

import React, { useState, useEffect } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import type { SupplyRequest, SupplyRequestItem } from '@/types';
import { updateSupplyRequest } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ApproveRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: SupplyRequest;
  onConfirm: () => void;
}

export function ApproveRequestDialog({ isOpen, onClose, request, onConfirm }: ApproveRequestDialogProps) {
  const [approvedItems, setApprovedItems] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const { instituteId } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (request) {
      const initialMap = new Map<string, number>();
      request.items.forEach(item => {
        initialMap.set(item.itemId, item.approvedQuantity ?? item.requestedQuantity);
      });
      setApprovedItems(initialMap);
    }
  }, [request]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newMap = new Map(approvedItems);
    newMap.set(itemId, Math.max(0, quantity));
    setApprovedItems(newMap);
  };

  const handleConfirm = async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const updatedItems: SupplyRequestItem[] = request.items.map(item => ({
        ...item,
        approvedQuantity: approvedItems.get(item.itemId) ?? item.requestedQuantity,
      }));
      
      await updateSupplyRequest(instituteId, request.id, {
        status: 'Aprobado',
        items: updatedItems,
      });
      
      toast({ title: "Pedido Aprobado", description: "Las cantidades han sido confirmadas y el pedido está listo para ser entregado." });
      onConfirm();
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo aprobar el pedido.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aprobar Pedido: {request.code}</DialogTitle>
          <DialogDescription>
            Confirme o ajuste las cantidades a entregar para el pedido de <span className="font-bold">{request.requesterName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-center">Solicitado</TableHead>
                <TableHead className="w-[120px] text-center">Aprobado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.items.map(item => (
                <TableRow key={item.itemId}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-center">{item.requestedQuantity}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={approvedItems.get(item.itemId) ?? ''}
                      onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value, 10) || 0)}
                      className="h-8 text-center"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aprobar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
