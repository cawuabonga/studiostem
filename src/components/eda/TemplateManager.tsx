'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getDocumentTemplates, saveDocumentTemplate, deleteDocumentTemplate } from '@/services/eda-service';
import { getPaymentConcepts } from '@/config/firebase';
import type { DocumentTemplate, DocumentCategory, EDARequirement, PaymentConcept } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle, 
    CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter, 
    DialogClose 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage,
    FormDescription
} from '@/components/ui/form';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Loader2, 
    PlusCircle, 
    Trash, 
    Edit, 
    FileText, 
    Info, 
    Code, 
    CheckCircle2, 
    DollarSign,
    ExternalLink,
    Eye,
    Printer
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CATEGORIES: DocumentCategory[] = ['Constancia', 'Boleta', 'Ficha', 'Solicitud'];
const REQUIREMENTS: EDARequirement[] = ['Gratuito', 'Pago Validado'];

const AVAILABLE_VARIABLES = [
    { key: '{nombre_completo}', label: 'Nombre Completo del Alumno' },
    { key: '{dni}', label: 'Número de DNI/ID' },
    { key: '{carrera}', label: 'Programa de Estudios' },
    { key: '{ciclo_actual}', label: 'Ciclo / Semestre' },
    { key: '{turno}', label: 'Turno' },
    { key: '{fecha_hoy}', label: 'Fecha de Emisión' },
    { key: '{instituto_nombre}', label: 'Nombre del Instituto' },
];

const templateSchema = z.object({
  name: z.string().min(5, 'El nombre debe ser descriptivo.'),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  content: z.string().min(20, 'El contenido de la plantilla es requerido.'),
  requirementType: z.enum(REQUIREMENTS as [string, ...string[]]),
  requirementValue: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof templateSchema>;

export function TemplateManager() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [concepts, setConcepts] = useState<PaymentConcept[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
    const [deletingTemplate, setDeletingTemplate] = useState<DocumentTemplate | null>(null);
    
    // Preview state
    const [previewingTemplate, setPreviewingTemplate] = useState<DocumentTemplate | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(templateSchema),
        defaultValues: { isActive: true, requirementType: 'Gratuito' }
    });

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const [templatesData, conceptsData] = await Promise.all([
                getDocumentTemplates(instituteId),
                getPaymentConcepts(instituteId, true)
            ]);
            setTemplates(templatesData);
            setConcepts(conceptsData);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las plantillas.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenDialog = (template?: DocumentTemplate) => {
        setEditingTemplate(template || null);
        form.reset({
            name: template?.name || '',
            category: template?.category || 'Constancia',
            content: template?.content || '',
            requirementType: template?.requirementType || 'Gratuito',
            requirementValue: template?.requirementValue || '',
            isActive: template?.isActive ?? true,
        });
        setIsDialogOpen(true);
    };

    const insertVariable = (variable: string) => {
        const currentContent = form.getValues('content');
        form.setValue('content', currentContent + ' ' + variable);
    };

    const onSubmit = async (data: FormValues) => {
        if (!instituteId) return;
        setIsSubmitting(true);
        try {
            const detectedVariables = AVAILABLE_VARIABLES
                .filter(v => data.content.includes(v.key))
                .map(v => v.key);

            await saveDocumentTemplate(instituteId, { 
                ...data, 
                variables: detectedVariables,
                instituteId 
            }, editingTemplate?.id);

            toast({ title: editingTemplate ? "Plantilla Actualizada" : "Plantilla Guardada" });
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!instituteId || !deletingTemplate) return;
        try {
            await deleteDocumentTemplate(instituteId, deletingTemplate.id);
            toast({ title: "Plantilla Eliminada" });
            fetchData();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        } finally {
            setDeletingTemplate(null);
        }
    };

    const getPreviewHtml = (template: DocumentTemplate) => {
        let content = template.content;
        const dummyData: Record<string, string> = {
            '{nombre_completo}': 'JUAN PÉREZ GARCÍA',
            '{dni}': '76543210',
            '{carrera}': 'ENFERMERÍA TÉCNICA',
            '{ciclo_actual}': 'V SEMESTRE',
            '{turno}': 'MAÑANA',
            '{fecha_hoy}': new Date().toLocaleDateString('es-PE'),
            '{instituto_nombre}': 'INSTITUTO SUPERIOR TECNOLÓGICO STEM',
        };

        Object.entries(dummyData).forEach(([key, val]) => {
            content = content.replaceAll(key, `<span class="bg-yellow-100 font-bold px-1 rounded border border-yellow-200 text-yellow-800">${val}</span>`);
        });

        return content;
    };

    const requirementType = form.watch('requirementType');

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenDialog()} className="font-black rounded-xl h-11 px-6 shadow-lg">
                    <PlusCircle className="mr-2 h-4 w-4" /> NUEVO DISEÑO DE DOCUMENTO
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)
                ) : templates.length > 0 ? (
                    templates.map(template => (
                        <Card key={template.id} className={cn(
                            "group hover:border-primary/40 hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden flex flex-col border-primary/5 bg-white",
                            !template.isActive && "opacity-60 grayscale-[0.5]"
                        )}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant="secondary" className="font-black text-[9px] uppercase tracking-widest">
                                        {template.category}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                        {template.requirementType === 'Pago Validado' && (
                                            <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-black uppercase">
                                                REQUIERE PAGO
                                            </Badge>
                                        )}
                                        <Badge variant={template.isActive ? 'default' : 'outline'} className="text-[8px] font-black uppercase">
                                            {template.isActive ? 'ACTIVA' : 'INACTIVA'}
                                        </Badge>
                                    </div>
                                </div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight line-clamp-2 min-h-[3rem] leading-tight">
                                    {template.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow pt-4">
                                <div className="p-3 rounded-2xl bg-muted/30 border border-dashed border-primary/10 mb-4">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-2">Variables Dinámicas</p>
                                    <div className="flex flex-wrap gap-1">
                                        {template.variables.map(v => (
                                            <code key={v} className="text-[9px] bg-white px-1.5 py-0.5 rounded border font-mono font-bold text-primary">
                                                {v}
                                            </code>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-muted/20 p-4 flex gap-2">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary" onClick={() => setPreviewingTemplate(template)}>
                                    <Eye className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" className="flex-1 font-bold h-10 rounded-xl" onClick={() => handleOpenDialog(template)}>
                                    <Edit className="h-4 w-4 mr-2" /> Editar
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => setDeletingTemplate(template)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-24 text-center text-muted-foreground border-2 border-dashed rounded-[3rem] bg-muted/5">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-10" />
                        <p className="text-xl font-black uppercase tracking-widest">Sin plantillas diseñadas</p>
                        <p className="text-sm mt-2">Cree su primer documento oficial para impresión automática.</p>
                    </div>
                )}
            </div>

            {/* Dialog: Registro/Edición */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                            {editingTemplate ? 'Editar Diseño' : 'Nueva Plantilla de Documento'}
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 font-medium">Use llaves como {`{nombre}`} para que el sistema rellene los datos automáticamente.</DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
                                <div className="flex-1 p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Nombre del Documento</FormLabel><FormControl><Input placeholder="Ej: Constancia de Estudios Gratuita" {...field} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name="category" render={({ field }) => (
                                            <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Categoría</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
                                        )}/>
                                    </div>

                                    <FormField control={form.control} name="content" render={({ field }) => (
                                        <FormItem className="flex-1 flex flex-col">
                                            <FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Cuerpo del Documento (HTML / Texto)</FormLabel>
                                            <div className="flex-1 min-h-[300px] border rounded-2xl overflow-hidden bg-muted/10">
                                                <FormControl><Textarea {...field} className="h-full border-none focus-visible:ring-0 font-mono text-sm leading-relaxed p-6 resize-none" placeholder="Escriba aquí el contenido oficial..." /></FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </div>

                                <aside className="w-full lg:w-[320px] bg-muted/30 border-l p-8 space-y-8 shrink-0 overflow-y-auto">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                            <Code className="h-4 w-4" /> Inyectar Datos
                                        </h4>
                                        <div className="space-y-2">
                                            {AVAILABLE_VARIABLES.map(v => (
                                                <button 
                                                    key={v.key} 
                                                    type="button" 
                                                    onClick={() => insertVariable(v.key)}
                                                    className="w-full text-left p-2 rounded-xl bg-white border border-primary/5 hover:border-primary hover:shadow-md transition-all text-[10px] flex justify-between items-center group"
                                                >
                                                    <span className="font-bold text-slate-600">{v.label}</span>
                                                    <code className="text-primary font-black group-hover:scale-110 transition-transform">{v.key}</code>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" /> Config. Emisión
                                        </h4>
                                        <FormField control={form.control} name="requirementType" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold">Tipo de Requisito</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>{REQUIREMENTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}/>

                                        {requirementType === 'Pago Validado' && (
                                            <FormField control={form.control} name="requirementValue" render={({ field }) => (
                                                <FormItem className="animate-in slide-in-from-top-2 duration-300">
                                                    <FormLabel className="text-xs font-bold text-amber-600">Tasa Vinculada</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger className="h-10 bg-white border-amber-200"><SelectValue placeholder="Elegir concepto..." /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {concepts.map(c => <SelectItem key={c.id} value={c.name}>{c.name} (S/ {c.amount})</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription className="text-[9px]">El Point Print solo imprimirá si el alumno tiene un pago de este tipo validado.</FormDescription>
                                                </FormItem>
                                            )}/>
                                        )}

                                        <FormField control={form.control} name="isActive" render={({ field }) => (
                                            <FormItem className="flex items-center justify-between p-4 bg-white rounded-2xl border border-primary/5">
                                                <FormLabel className="text-xs font-bold m-0">Estado: {field.value ? 'Activa' : 'Borrador'}</FormLabel>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}/>
                                    </div>
                                </aside>
                            </div>

                            <DialogFooter className="p-8 bg-muted/50 border-t flex gap-3 shrink-0">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold rounded-xl h-12 flex-1">CANCELAR</Button>
                                <Button type="submit" disabled={isSubmitting} className="font-black rounded-xl h-12 flex-[2] shadow-xl shadow-primary/20">
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                                    {editingTemplate ? 'GUARDAR DISEÑO' : 'CREAR PLANTILLA OFICIAL'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Dialog: Previsualización */}
            <Dialog open={!!previewingTemplate} onOpenChange={(open) => !open && setPreviewingTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-100 border-b shrink-0">
                        <div className="flex justify-between items-center pr-8">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm">
                                    <Eye className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-black uppercase tracking-tight">Simulación de Documento</DialogTitle>
                                    <DialogDescription className="text-xs font-bold">Vista previa de: {previewingTemplate?.name}</DialogDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-bold text-[9px] uppercase">DATO SIMULADO</Badge>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 bg-slate-50">
                        <div className="p-12">
                            {/* Papel A4 Simulado */}
                            <Card className="max-w-[210mm] mx-auto min-h-[297mm] shadow-2xl border-none p-[25mm] bg-white rounded-none relative overflow-hidden">
                                {/* Filigrana Simbolica */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                                    <FileText className="w-[400px] h-[400px]" />
                                </div>

                                <div className="relative z-10 font-serif text-black prose prose-slate max-w-none">
                                    {previewingTemplate && (
                                        <div 
                                            className="document-render-preview text-[12pt] leading-relaxed text-justify whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={{ __html: getPreviewHtml(previewingTemplate) }} 
                                        />
                                    )}
                                </div>
                            </Card>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 bg-white border-t flex gap-3 shrink-0">
                        <div className="flex-1 flex items-center gap-2 text-[10px] text-muted-foreground italic font-medium">
                            <Info className="h-4 w-4" />
                            Los campos resaltados en amarillo son variables dinámicas que se llenarán automáticamente.
                        </div>
                        <Button variant="ghost" onClick={() => setPreviewingTemplate(null)} className="font-bold rounded-xl h-10 px-8">CERRAR VISOR</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase text-primary">¿Eliminar Plantilla?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-slate-600">Esta acción es irreversible y el documento <strong>{deletingTemplate?.name}</strong> dejará de estar disponible en todos los puntos de impresión.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold h-11">CANCELAR</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black h-11">ELIMINAR PERMANENTE</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}