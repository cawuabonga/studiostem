
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getNonTeachingActivities, addNonTeachingActivity, updateNonTeachingActivity, deleteNonTeachingActivity } from "@/config/firebase";
import type { NonTeachingActivity } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, PlusCircle, Trash, Edit, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityAssignmentDetails } from "@/components/carga-horaria/ActivityAssignmentDetails";

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
      setActivities(fetchedActivities.sort((a,b) => a.name.localeCompare(b.name)));
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
              Crea el catálogo de actividades y expande cada una para ver los docentes asignados.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Añadir Actividad
          </Button>
        </CardHeader>
        <CardContent>
           {loading ? (
             <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
             </div>
           ) : activities.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {activities.map(activity => (
                        <AccordionItem key={activity.id} value={activity.id} className="border rounded-lg shadow-sm">
                            <AccordionTrigger className="px-4 py-2 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                                <div className="flex justify-between items-center w-full">
                                    <div className="text-left">
                                        <p className="font-semibold">{activity.name}</p>
                                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 pr-4">
                                         <Badge variant={activity.isActive ? 'default' : 'secondary'}>
                                            {activity.isActive ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenDialog(activity); }}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(activity.id); }}><Trash className="h-4 w-4" /></Button>
                                         <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <ActivityAssignmentDetails activityId={activity.id} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
           ) : (
                <p className="text-center text-muted-foreground py-8">No hay actividades no lectivas registradas.</p>
           )}
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
