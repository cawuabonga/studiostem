
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { addPlan, updatePlan } from '@/config/firebase';
import type { Plan } from '@/types';
import { Loader2, CheckCircle2, ListChecks, Info } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

// Listado granular de módulos de la plataforma
const PLATFORM_MODULES = [
    // GESTIÓN ACADÉMICA
    { id: 'programs_units', name: 'Programas y Unidades', defaultDesc: 'Gestión de currícula y catálogo de cursos.' },
    { id: 'enrollment_manager', name: 'Matrícula Digital', defaultDesc: 'Proceso de inscripción y gestión de secciones.' },
    { id: 'gradebook_system', name: 'Registro de Evaluación', defaultDesc: 'Sistema centralizado de notas por indicador.' },
    { id: 'attendance_tracking', name: 'Control de Asistencia', defaultDesc: 'Monitoreo de asistencia presencial y virtual.' },
    { id: 'efsrt_supervision', name: 'Seguimiento EFSRT', defaultDesc: 'Supervisión de experiencias formativas (prácticas).' },
    { id: 'graduation_audit', name: 'Auditoría de Egreso', defaultDesc: 'Verificación de requisitos para egresados.' },
    
    // APRENDIZAJE Y LMS
    { id: 'lms_workspace', name: 'LMS Estudiantil', defaultDesc: 'Materiales, tareas y comunicación por semana.' },
    { id: 'virtual_classroom', name: 'Aula Virtual HD', defaultDesc: 'Videoclases seguras integradas (Jitsi JaaS).' },
    
    // ADMINISTRACIÓN Y TESORERÍA
    { id: 'treasury_core', name: 'Tesorería y Pagos', defaultDesc: 'Gestión de tasas y validación de vouchers.' },
    { id: 'pos_cashier', name: 'Terminal de Cobro (Caja)', defaultDesc: 'Módulo de cobranza presencial para tesorería.' },
    { id: 'physical_infrastructure', name: 'Gestión de Ambientes', defaultDesc: 'Control de edificios, aulas y laboratorios.' },
    { id: 'asset_inventory', name: 'Inventario Patrimonial', defaultDesc: 'Control de activos fijos y bienes institucionales.' },
    { id: 'supply_chain', name: 'Almacén de Insumos', defaultDesc: 'Pedidos de materiales y control de stock.' },
    
    // INTEGRACIONES Y SERVICIOS
    { id: 'job_board_pro', name: 'Bolsa de Trabajo Pro', defaultDesc: 'Monitor de empleos y conexión con empresas.' },
    { id: 'iot_access_control', name: 'Seguridad IoT (RFID)', defaultDesc: 'Control de acceso físico mediante hardware.' },
    { id: 'user_profiles', name: 'Gestión de Usuarios', defaultDesc: 'Control de perfiles, roles y vinculación DNI.' },
    
    // AVANZADO
    { id: 'ai_hybrid_engine', name: 'Inteligencia Artificial', defaultDesc: 'Generación de sílabos e imágenes (Cloud/Local).' },
    { id: 'bi_reports', name: 'Reportes y BI', defaultDesc: 'Dashboards avanzados de gestión y recaudación.' },
];

const planSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
  billingCycle: z.enum(['mensual', 'anual']),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof planSchema>;

interface AddPlanDialogProps {
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
  existingPlan?: Plan | null;
}

export function AddPlanDialog({ isOpen, onClose, existingPlan }: AddPlanDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedModules, setSelectedModules] = useState<Record<string, { included: boolean, description: string }>>({});

  const isEditMode = !!existingPlan;

  const form = useForm<FormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      billingCycle: 'mensual',
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && existingPlan) {
        form.reset({
          name: existingPlan.name,
          description: existingPlan.description,
          price: existingPlan.price,
          billingCycle: existingPlan.billingCycle,
          isActive: existingPlan.isActive,
        });

        const initialModules: Record<string, { included: boolean, description: string }> = {};
        PLATFORM_MODULES.forEach(mod => {
            const foundFeature = existingPlan.features.find(f => f.startsWith(`${mod.name}:`));
            if (foundFeature) {
                initialModules[mod.id] = {
                    included: true,
                    description: foundFeature.split(':')[1]?.trim() || mod.defaultDesc
                };
            } else {
                initialModules[mod.id] = { included: false, description: mod.defaultDesc };
            }
        });
        setSelectedModules(initialModules);

      } else {
        form.reset({
          name: '',
          description: '',
          price: 0,
          billingCycle: 'mensual',
          isActive: true,
        });
        
        const initialModules: Record<string, { included: boolean, description: string }> = {};
        PLATFORM_MODULES.forEach(mod => {
            initialModules[mod.id] = { included: false, description: mod.defaultDesc };
        });
        setSelectedModules(initialModules);
      }
    }
  }, [isOpen, existingPlan, isEditMode, form]);

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => ({
        ...prev,
        [moduleId]: { 
            ...prev[moduleId], 
            included: !prev[moduleId].included 
        }
    }));
  };

  const updateModuleDesc = (moduleId: string, desc: string) => {
    setSelectedModules(prev => ({
        ...prev,
        [moduleId]: { 
            ...prev[moduleId], 
            description: desc 
        }
    }));
  };

  const onSubmit = async (data: FormValues) => {
    const selectedCount = Object.values(selectedModules).filter(m => m.included).length;
    if (selectedCount === 0) {
        toast({ title: "Plan Incompleto", description: "Selecciona al menos un módulo para incluir en este plan.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    
    const featuresArray = PLATFORM_MODULES
        .filter(mod => selectedModules[mod.id]?.included)
        .map(mod => `${mod.name}: ${selectedModules[mod.id].description}`);

    const planData = {
        ...data,
        features: featuresArray
    };

    try {
      if (isEditMode && existingPlan) {
        await updatePlan(existingPlan.id, planData);
        toast({ title: 'Plan Actualizado', description: 'Los cambios se han guardado.' });
      } else {
        await addPlan(planData);
        toast({ title: 'Plan Creado', description: 'El nuevo plan está disponible para los institutos.' });
      }
      onClose(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo procesar el plan.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                <ListChecks className="h-6 w-6 text-accent" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                    {isEditMode ? 'Editar Configuración del Plan' : 'Arquitectura de Nuevo Plan'}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80 font-medium">Habilite funciones granulares y defina límites por módulo.</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Detalles Comerciales</h3>
                            
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Nombre del Plan</FormLabel><FormControl><Input placeholder="Ej: Plan Educación 360" {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                            )} />

                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Precio Base (S/)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-11 font-black text-lg" /></FormControl><FormMessage /></FormItem>
                            )} />

                            <FormField control={form.control} name="billingCycle" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold">Frecuencia de Cobro</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="mensual">Facturación Mensual</SelectItem><SelectItem value="anual">Suscripción Anual</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Resumen para Clientes</FormLabel><FormControl><Textarea placeholder="Ej: Ideal para institutos de más de 1,000 alumnos..." {...field} className="resize-none h-24 text-xs font-medium" /></FormControl><FormMessage /></FormItem>
                            )} />

                            <FormField control={form.control} name="isActive" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-2xl border p-4 bg-primary/5">
                                    <div className="space-y-0.5">
                                        <FormLabel className="font-black text-[10px] uppercase tracking-wider">Estado del Plan</FormLabel>
                                        <p className={cn("text-xs font-bold uppercase", field.value ? "text-green-600" : "text-muted-foreground")}>
                                            {field.value ? "PÚBLICO" : "BORRADOR"}
                                        </p>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Selección de Funciones Específicas</h3>
                                <Badge variant="secondary" className="font-black text-[10px] uppercase h-6 px-3">
                                    {Object.values(selectedModules).filter(m => m.included).length} de {PLATFORM_MODULES.length} módulos
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {PLATFORM_MODULES.map(mod => {
                                    const isSelected = selectedModules[mod.id]?.included;
                                    return (
                                        <div key={mod.id} className={cn(
                                            "p-4 rounded-2xl border transition-all flex flex-col gap-3 group h-fit",
                                            isSelected ? "bg-white border-primary ring-2 ring-primary/10 shadow-lg" : "bg-muted/10 opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0"
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox 
                                                        id={mod.id} 
                                                        checked={isSelected} 
                                                        onCheckedChange={() => toggleModule(mod.id)}
                                                        className="h-5 w-5 rounded-md border-2"
                                                    />
                                                    <Label htmlFor={mod.id} className="text-xs font-black uppercase tracking-tight cursor-pointer leading-tight">
                                                        {mod.name}
                                                    </Label>
                                                </div>
                                                {isSelected && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                            </div>

                                            {isSelected && (
                                                <div className="animate-in slide-in-from-top-1 duration-200">
                                                    <div className="relative">
                                                        <Input 
                                                            value={selectedModules[mod.id].description} 
                                                            onChange={e => updateModuleDesc(mod.id, e.target.value)}
                                                            placeholder="Límite o detalle comercial..."
                                                            className="h-9 pl-3 text-[11px] border-primary/20 bg-primary/5 font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <DialogFooter className="p-8 bg-muted/20 border-t shrink-0">
              <DialogClose asChild><Button type="button" variant="ghost" className="font-bold h-12 px-8">CERRAR</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting} className="font-black h-12 px-12 shadow-xl shadow-primary/20">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEditMode ? 'GUARDAR CAMBIOS' : 'CREAR PLAN DE SERVICIO'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
