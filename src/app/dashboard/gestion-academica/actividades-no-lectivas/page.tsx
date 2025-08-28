
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNonTeachingActivities, addNonTeachingActivity, updateNonTeachingActivity, deleteNonTeachingActivity } from "@/config/firebase";
import type { NonTeachingActivity } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Trash, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function NonTeachingActivitiesPage() {
  const { user, instituteId, loading: authLoading, hasPermission } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activities, setActivities] = useState<NonTeachingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Partial<NonTeachingActivity>>({});

  const canManage = hasPermission('academic:program:manage'); // Reuse a suitable high-level permission

  useEffect(() => {
    if (!authLoading) {
      if (!user || !canManage) {
        router.push('/dashboard');
      } else if (instituteId) {
        fetchActivities();
      }
    }
  }, [user, authLoading, instituteId, router, canManage]);

  const fetchActivities = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedActivities = await getNonTeachingActivities(instituteId);
      setActivities(fetchedActivities);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las actividades.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  const handleOpenDialog = (activity?: NonTeachingActivity) => {
    setCurrentActivity(activity || { name: '', description: '', isActive: true });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!instituteId || !currentActivity.name || !currentActivity.description) {
      toast({ title: "Datos incompletos", description: "Por favor, complete el nombre y la descripción.", variant: "destructive"});
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (currentActivity.id) {
        await updateNonTeachingActivity(instituteId, currentActivity.id, currentActivity);
        toast({ title: "Actividad actualizada", description: `"${currentActivity.name}" ha sido actualizada.` });
      } else {
        await addNonTeachingActivity(instituteId, currentActivity as Omit<NonTeachingActivity, 'id'>);
        toast({ title: "Actividad creada", description: `"${currentActivity.name}" ha sido creada.` });
      }
      fetchActivities();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!instituteId) return;
    try {
        await deleteNonTeachingActivity(instituteId, activityId);
        toast({ title: "Actividad Eliminada", description: "La actividad no lectiva ha sido eliminada." });
        fetchActivities();
    } catch (error: any) {
        toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    }
  };
  
  if (authLoading || !canManage) {
    return <p>Cargando o no autorizado...</p>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestionar Actividades No Lectivas</CardTitle>
            <CardDescription>
              Crea y administra el catálogo de actividades no lectivas que se pueden asignar al personal docente.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Añadir Actividad
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre de la Actividad</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Cargando...</TableCell></TableRow>
                    ) : activities.length > 0 ? (
                        activities.map(activity => (
                            <TableRow key={activity.id}>
                                <TableCell className="font-medium">{activity.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{activity.description}</TableCell>
                                <TableCell>
                                    <Badge variant={activity.isActive ? 'default' : 'secondary'}>
                                        {activity.isActive ? 'Activa' : 'Inactiva'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(activity)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(activity.id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow><TableCell colSpan={4} className="h-24 text-center">No hay actividades registradas.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{currentActivity.id ? 'Editar Actividad' : 'Nueva Actividad No Lectiva'}</DialogTitle>
                  <DialogDescription>
                      Complete la información de la actividad.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="name">Nombre de la Actividad</Label>
                      <Input id="name" value={currentActivity.name || ''} onChange={(e) => setCurrentActivity(p => ({...p, name: e.target.value}))} placeholder="Ej: Tutoría y consejería"/>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea id="description" value={currentActivity.description || ''} onChange={(e) => setCurrentActivity(p => ({...p, description: e.target.value}))} placeholder="Describe brevemente en qué consiste la actividad."/>
                  </div>
                   <div className="flex items-center space-x-2">
                      <Switch id="isActive" checked={currentActivity.isActive} onCheckedChange={(checked) => setCurrentActivity(p => ({...p, isActive: checked}))} />
                      <Label htmlFor="isActive">Activa (disponible para asignación)</Label>
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
