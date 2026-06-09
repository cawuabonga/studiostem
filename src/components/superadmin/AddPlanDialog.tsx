
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

// Listado maestro de módulos de la plataforma para gestión automática
const PLATFORM_MODULES = [
    { id: 'lms_core', name: 'LMS Core', defaultDesc: 'Planificación, Materiales y Tareas.' },
    { id: 'aula_virtual', name: 'Aula Virtual STEM', defaultDesc: 'Videoclases en vivo (Jitsi/8x8).' },
    { id: 'gestion_academica', name: 'Gestión Académica', defaultDesc: 'Matrículas, Unidades y Programas.' },
    { id: 'notas_asistencia', name: 'Evaluación y Asistencia', defaultDesc: 'Registro de notas y control de asistencia manual.' },
    { id: 'iot_rfid', name: 'Integración IoT (RFID)', defaultDesc: 'Control de acceso automatizado con hardware.' },
    { id: 'pagos_tesoreria', name: 'Tesorería y Pagos', defaultDesc: 'Gestión de tasas y validación de vouchers.' },
    { id: 'bolsa_laboral', name: 'Bolsa de Trabajo', defaultDesc: 'Conexión con empresas y postulaciones.' },
    { id: 'infraestructura', name: 'Infraestructura e Inventario', defaultDesc: 'Gestión de ambientes y activos fijos.' },
    { id: 'abastecimiento', name: 'Abastecimiento y Almacén', defaultDesc: 'Catálogo de insumos y PECOSAs.' },
    { id: 'ia_genkit', name: 'Inteligencia Artificial', defaultDesc: 'Generación de contenidos con Google/Ollama.' },
    { id: 'reportes_analytics', name: 'Reportes y Analítica', defaultDesc: 'Gráficos avanzados y reportes exportables.' },
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
  
  // Estado local para los módulos seleccionados y sus descripciones personalizadas
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

        // Reconstruir la selección de módulos a partir del array de strings 'features'
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
        
        // Inicializar con todos los módulos desactivados
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
    // Validar que haya al menos un módulo seleccionado
    const selectedCount = Object.values(selectedModules).filter(m => m.included).length;
    if (selectedCount === 0) {
        toast({ title: "Plan Incompleto", description: "Selecciona al menos un módulo para incluir en este plan.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    
    // Transformar los módulos seleccionados en el formato "Nombre: Descripción"
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                <ListChecks className="h-6 w-6 text-accent" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                    {isEditMode ? 'Editar Plan de Servicio' : 'Diseñar Nuevo Plan SaaS'}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80 font-medium">Configure los módulos incluidos y los límites comerciales.</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* COLUMNA IZQUIERDA: Datos Básicos */}
                        <div className="lg:col-span-4 space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Información Comercial</h3>
                            
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Nombre del Plan</FormLabel><FormControl><Input placeholder="Ej: Plan Institucional Pro" {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                            )} />

                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Precio Base (S/)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-11 font-mono" /></FormControl><FormMessage /></FormItem>
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
                                <FormItem><FormLabel className="font-bold">Resumen de Ventas</FormLabel><FormControl><Textarea placeholder="Describe el público objetivo de este plan..." {...field} className="resize-none h-24 text-xs" /></FormControl><FormMessage /></FormItem>
                            )} />

                            <FormField control={form.control} name="isActive" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-2xl border p-4 bg-muted/20">
                                    <div className="space-y-0.5">
                                        <FormLabel className="font-bold text-xs uppercase">Visibilidad</FormLabel>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Plan Publicado</p>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        {/* COLUMNA DERECHA: Configuración de Módulos (Features) */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Configuración de Módulos Incluidos</h3>
                                <Badge variant="outline" className="font-black text-[10px] uppercase">
                                    {Object.values(selectedModules).filter(m => m.included).length} Seleccionados
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {PLATFORM_MODULES.map(mod => {
                                    const isSelected = selectedModules[mod.id]?.included;
                                    return (
                                        <div key={mod.id} className={cn(
                                            "p-4 rounded-2xl border transition-all flex flex-col gap-3 group",
                                            isSelected ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/10 opacity-70 grayscale-[0.5]"
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox 
                                                        id={mod.id} 
                                                        checked={isSelected} 
                                                        onCheckedChange={() => toggleModule(mod.id)}
                                                        className="h-5 w-5 rounded-md"
                                                    />
                                                    <Label htmlFor={mod.id} className="text-sm font-black uppercase tracking-tight cursor-pointer">
                                                        {mod.name}
                                                    </Label>
                                                </div>
                                                {isSelected ? (
                                                    <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] uppercase tracking-tighter">Incluido en Plan</Badge>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Desactivado</span>
                                                )}
                                            </div>

                                            {isSelected && (
                                                <div className="animate-in slide-in-from-top-2 duration-300">
                                                    <div className="relative">
                                                        <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                        <Input 
                                                            value={selectedModules[mod.id].description} 
                                                            onChange={e => updateModuleDesc(mod.id, e.target.value)}
                                                            placeholder="Detalle comercial o límite (ej: Hasta 500 alumnos)"
                                                            className="h-10 pl-9 text-xs border-primary/10 bg-white"
                                                        />
                                                    </div>
                                                    <p className="text-[9px] text-muted-foreground mt-2 ml-1 italic">Este texto aparecerá en las tarjetas de precios para los clientes.</p>
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
              <DialogClose asChild><Button type="button" variant="ghost" className="font-bold h-12 px-8">CANCELAR</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting} className="font-black h-12 px-12 shadow-xl shadow-primary/20">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {isEditMode ? 'ACTUALIZAR PLAN OFICIAL' : 'REGISTRAR PLAN DE SERVICIO'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
