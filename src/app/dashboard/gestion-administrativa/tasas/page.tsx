
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaymentConcepts, addPaymentConcept, updatePaymentConcept, deletePaymentConcept } from "@/config/firebase";
import type { PaymentConcept } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Trash, Edit, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

export default function TasasPage() {
  const { user, instituteId, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [concepts, setConcepts] = useState<PaymentConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentConcept, setCurrentConcept] = useState<Partial<PaymentConcept>>({});

  useEffect(() => {
    if (!authLoading) {
      if (!user || !["Admin", "Coordinator"].includes(user.role)) {
        router.push('/dashboard');
      } else if (instituteId) {
        fetchConcepts();
      }
    }
  }, [user, authLoading, instituteId, router]);

  const fetchConcepts = async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedConcepts = await getPaymentConcepts(instituteId);
      setConcepts(fetchedConcepts);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las tasas.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (concept?: PaymentConcept) => {
    setCurrentConcept(concept || { code: '', name: '', amount: 0, isActive: true });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!instituteId || !currentConcept.code || !currentConcept.name || (currentConcept.amount ?? 0) <= 0) {
      toast({ title: "Datos incompletos", description: "Por favor, complete el código, nombre y un monto válido.", variant: "destructive"});
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (currentConcept.id) {
        await updatePaymentConcept(instituteId, currentConcept.id, currentConcept);
        toast({ title: "Tasa actualizada", description: `"${currentConcept.name}" ha sido actualizada.` });
      } else {
        await addPaymentConcept(instituteId, currentConcept as any);
        toast({ title: "Tasa creada", description: `"${currentConcept.name}" ha sido creada.` });
      }
      fetchConcepts();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (conceptId: string) => {
    if (!instituteId) return;
    try {
        await deletePaymentConcept(instituteId, conceptId);
        toast({ title: "Tasa Eliminada", description: "El concepto de pago ha sido eliminado." });
        fetchConcepts();
    } catch (error: any) {
        toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tasas Educativas y Conceptos de Pago</CardTitle>
            <CardDescription>
              Administra los diferentes conceptos de pago que los estudiantes pueden registrar.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Añadir Tasa
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre del Concepto</TableHead>
                        <TableHead>Monto (S/)</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha de Creación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center">Cargando...</TableCell></TableRow>
                    ) : concepts.length > 0 ? (
                        concepts.map(concept => (
                            <TableRow key={concept.id}>
                                <TableCell className="font-mono">{concept.code}</TableCell>
                                <TableCell className="font-medium">{concept.name}</TableCell>
                                <TableCell>{concept.amount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={concept.isActive ? 'default' : 'secondary'}>
                                        {concept.isActive ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(concept.createdAt.toDate(), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(concept)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(concept.id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow><TableCell colSpan={6} className="h-24 text-center">No hay tasas registradas.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{currentConcept.id ? 'Editar Tasa' : 'Nueva Tasa Educativa'}</DialogTitle>
                  <DialogDescription>
                      Complete la información para el concepto de pago.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="code">Código</Label>
                      <Input id="code" value={currentConcept.code || ''} onChange={(e) => setCurrentConcept(p => ({...p, code: e.target.value.toUpperCase()}))} placeholder="Ej: MATR-01"/>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Concepto</Label>
                      <Input id="name" value={currentConcept.name || ''} onChange={(e) => setCurrentConcept(p => ({...p, name: e.target.value}))}/>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="amount">Monto (S/)</Label>
                      <Input id="amount" type="number" value={currentConcept.amount || ''} onChange={(e) => setCurrentConcept(p => ({...p, amount: parseFloat(e.target.value) || 0}))}/>
                  </div>
                   <div className="flex items-center space-x-2">
                      <Switch id="isActive" checked={currentConcept.isActive} onCheckedChange={(checked) => setCurrentConcept(p => ({...p, isActive: checked}))} />
                      <Label htmlFor="isActive">Activo (Visible para estudiantes)</Label>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                  <Button onClick={handleSave} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      Guardar Cambios
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
