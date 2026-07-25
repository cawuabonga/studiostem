'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getDocumentTemplates, saveDocumentTemplate, deleteDocumentTemplate } from '@/services/eda-service';
import { getPaymentConcepts } from '@/config/firebase';
import type { DocumentTemplate, DocumentCategory, EDARequirement, PaymentConcept, EDALayoutType } from '@/types';
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
    Trash2, 
    Edit, 
    FileText, 
    Info, 
    Code, 
    CheckCircle2, 
    DollarSign,
    ExternalLink,
    Eye,
    Layout,
    Save
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
const LAYOUTS: { value: EDALayoutType, label: string }[] = [
    { value: 'structured_solicitud', label: 'Solicitud Formal (Estructurada)' },
    { value: 'raw_html', label: 'Diseño Libre (HTML/Texto)' },
];

const AVAILABLE_VARIABLES = [
    { key: '{nombre_completo}', label: 'Nombre Completo del Alumno' },
    { key: '{dni}', label: 'Número de DNI/ID' },
    { key: '{carrera}', label: 'Programa de Estudios' },
    { key: '{ciclo_actual}', label: 'Ciclo / Semestre' },
    { key: '{turno}', label: 'Turno' },
    { key: '{direccion}', label: 'Dirección del Alumno' },
    { key: '{fecha_hoy}', label: 'Fecha de Emisión' },
    { key: '{hora_hoy}', label: 'Hora de Emisión' },
    { key: '{instituto_nombre}', label: 'Nombre del Instituto' },
];

const templateSchema = z.object({
  name: z.string().min(5, 'El nombre debe ser descriptivo.'),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  layoutType: z.enum(['structured_solicitud', 'raw_html'] as const),
  sumilla: z.string().optional(),
  addresseeRole: z.string().optional(),
  content: z.string().min(20, 'El contenido o cuerpo del documento es requerido.'),
  requirementType: z.enum(REQUIREMENTS as [string, ...string[]]),
  requirementValue: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof templateSchema>;

export function TemplateManager() {
    const { instituteId, institute } = useAuth();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [concepts, setConcepts] = useState<PaymentConcept[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplate | null>(null);
    const [previewingTemplate, setPreviewingTemplate] = useState<DocumentTemplate | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(templateSchema),
        defaultValues: { isActive: true, requirementType: 'Gratuito', layoutType: 'structured_solicitud' }
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
            console.error("Error al cargar plantillas:", error);
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
            category: template?.category || 'Solicitud',
            layoutType: template?.layoutType || 'structured_solicitud',
            sumilla: template?.sumilla || 'SOLICITO: Justificación de inasistencias.',
            addresseeRole: template?.addresseeRole || 'Coordinador Académico',
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
                .filter(v => data.content.includes(v.key) || (data.sumilla?.includes(v.key)))
                .map(v => v.key);

            await saveDocumentTemplate(instituteId, { 
                ...data, 
                variables: detectedVariables,
                instituteId 
            }, editingTemplate?.id);

            toast({ title: editingTemplate ? "Diseño Actualizado" : "Diseño Guardado" });
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!instituteId || !templateToDelete) return;
        try {
            await deleteDocumentTemplate(instituteId, templateToDelete.id);
            toast({ title: "Diseño Eliminado", description: "La plantilla ha sido borrada permanentemente." });
            setTemplateToDelete(null);
            fetchData();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const layoutType = form.watch('layoutType');
    const requirementType = form.watch('requirementType');

    const dummyData: Record<string, string> = {
        '{nombre_completo}': 'ALEXANDER GUSTAVO PÉREZ RIVAS',
        '{dni}': '76543210',
        '{carrera}': 'ENFERMERÍA TÉCNICA',
        '{ciclo_actual}': 'V SEMESTRE',
        '{turno}': 'MAÑANA',
        '{direccion}': 'Av. Principal 456, Urb. Los Jardines',
        '{fecha_hoy}': new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
        '{hora_hoy}': new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        '{instituto_nombre}': institute?.name || 'INSTITUTO SUPERIOR TECNOLÓGICO STEM',
    };

    const getProcessedText = (text: string) => {
        let processed = text;
        Object.entries(dummyData).forEach(([key, val]) => {
            processed = processed.replaceAll(key, `<span class="bg-yellow-100 font-bold px-0.5 border-b border-yellow-400 text-yellow-900">${val}</span>`);
        });
        return processed;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenDialog()} className="font-black rounded-xl h-12 px-8 shadow-xl shadow-primary/20">
                    <PlusCircle className="mr-2 h-5 w-5" /> NUEVO DISEÑO EDA
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
                                        {template.layoutType === 'structured_solicitud' && <Badge className="bg-blue-50 text-blue-700 border-none text-[8px] font-black uppercase">ESTRUCTURADO</Badge>}
                                        <Badge variant={template.isActive ? 'default' : 'outline'} className="text-[8px] font-black uppercase">
                                            {template.isActive ? 'ACTIVA' : 'BORRADOR'}
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
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => setTemplateToDelete(template)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-24 text-center text-muted-foreground border-2 border-dashed rounded-[3rem] bg-muted/5">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-10" />
                        <p className="text-xl font-black uppercase tracking-widest">Sin diseños oficiales</p>
                        <p className="text-sm mt-2">Cree su primer documento para el sistema EDA.</p>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                                <Layout className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                    Configurador de Documento Oficial
                                </DialogTitle>
                                <DialogDescription className="text-primary-foreground/80 font-medium">Defina la lógica estructural para la generación automática.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                                <ScrollArea className="flex-1">
                                    <div className="p-8 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                <FormItem className="md:col-span-1"><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Nombre del Diseño</FormLabel><FormControl><Input placeholder="Ej: Solicitud Justificación v1" {...field} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>
                                            )}/>
                                            <FormField control={form.control} name="category" render={({ field }) => (
                                                <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
                                            )}/>
                                            <FormField control={form.control} name="layoutType" render={({ field }) => (
                                                <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Estructura</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent>{LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></FormItem>
                                            )}/>
                                        </div>

                                        <Separator />

                                        {layoutType === 'structured_solicitud' ? (
                                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <FormField control={form.control} name="sumilla" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">I. Sumilla (Asunto)</FormLabel><FormControl><Input placeholder="Ej: SOLICITO: Justificación de inasistencias" {...field} className="h-11 rounded-xl font-bold" /></FormControl><FormMessage /></FormItem>
                                                    )}/>
                                                    <FormField control={form.control} name="addresseeRole" render={({ field }) => (
                                                        <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">II. Dirigido a (Cargo)</FormLabel><FormControl><Input placeholder="Ej: Director General / Coordinador" {...field} className="h-11 rounded-xl uppercase" /></FormControl><FormDescription className="text-[9px]">Aparecerá en el encabezado de destino.</FormDescription><FormMessage /></FormItem>
                                                    )}/>
                                                </div>

                                                <FormField control={form.control} name="content" render={({ field }) => (
                                                    <FormItem className="space-y-3">
                                                        <FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">III. Cuerpo de la Solicitud (Argumento)</FormLabel>
                                                        <div className="min-h-[250px] border-2 border-dashed rounded-2xl overflow-hidden bg-muted/5">
                                                            <FormControl><Textarea {...field} className="h-full border-none focus-visible:ring-0 font-medium text-sm leading-relaxed p-6 resize-none" placeholder="Escriba aquí los párrafos principales del cuerpo del documento..." /></FormControl>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}/>
                                            </div>
                                        ) : (
                                            <FormField control={form.control} name="content" render={({ field }) => (
                                                <FormItem className="animate-in slide-in-from-right-4 duration-500">
                                                    <FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Contenido Libre (HTML/Texto)</FormLabel>
                                                    <div className="min-h-[400px] border rounded-2xl overflow-hidden">
                                                        <FormControl><Textarea {...field} className="h-full border-none focus-visible:ring-0 font-mono text-xs leading-relaxed p-6 resize-none" placeholder="Diseñe su documento desde cero..." /></FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                        )}
                                    </div>
                                </ScrollArea>

                                <aside className="w-full lg:w-[320px] bg-muted/30 border-l p-8 space-y-8 shrink-0 overflow-y-auto">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                            <Code className="h-4 w-4" /> Insertar Datos
                                        </h4>
                                        <div className="space-y-2">
                                            {AVAILABLE_VARIABLES.map(v => (
                                                <button 
                                                    key={v.key} 
                                                    type="button" 
                                                    onClick={() => insertVariable(v.key)}
                                                    className="w-full text-left p-2.5 rounded-xl bg-white border border-primary/5 hover:border-primary hover:shadow-md transition-all text-[10px] flex justify-between items-center group"
                                                >
                                                    <span className="font-bold text-slate-600 truncate mr-2">{v.label}</span>
                                                    <code className="text-primary font-black group-hover:scale-110 transition-transform shrink-0">{v.key}</code>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" /> Requisitos
                                        </h4>
                                        <FormField control={form.control} name="requirementType" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold">Tipo de Emisión</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>{REQUIREMENTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}/>

                                        {requirementType === 'Pago Validado' && (
                                            <FormField control={form.control} name="requirementValue" render={({ field }) => (
                                                <FormItem className="animate-in zoom-in-95">
                                                    <FormLabel className="text-xs font-bold text-amber-600">Vincular Tasa</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger className="h-10 bg-white border-amber-200"><SelectValue placeholder="Concepto..." /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {concepts.map(c => <SelectItem key={c.id} value={c.name}>{c.name} (S/ {c.amount})</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
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
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5 mr-2" />}
                                    {editingTemplate ? 'GUARDAR DISEÑO' : 'PUBLICAR DISEÑO'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!previewingTemplate} onOpenChange={(open) => !open && setPreviewingTemplate(null)}>
                <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-100 border-b shrink-0">
                        <div className="flex justify-between items-center pr-8">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                    <Eye className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-black uppercase tracking-tight text-primary">Vista Previa Institucional</DialogTitle>
                                    <DialogDescription className="text-xs font-bold">Simulación de impresión para: {previewingTemplate?.name}</DialogDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-bold text-[9px] uppercase">DATO SIMULADO</Badge>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 bg-slate-50">
                        <div className="p-12">
                            <Card className="max-w-[210mm] mx-auto min-h-[297mm] shadow-2xl border-none p-[25mm] bg-white rounded-none relative overflow-hidden text-black leading-relaxed">
                                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-8">
                                    <div className="flex items-center gap-4">
                                        {institute?.logoUrl && <img src={institute.logoUrl} alt="Logo" className="w-[60px] h-[60px] object-contain" />}
                                        <div className="text-left">
                                            <h1 className="text-[12pt] font-black uppercase leading-tight">{institute?.name}</h1>
                                            <p className="text-[8pt] text-gray-500 uppercase tracking-widest font-bold">Unidad de Secretaría Académica</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-[8pt] font-bold text-gray-400 uppercase tracking-tighter">
                                        Generado por Sistema EDA • STEM V2.1
                                    </div>
                                </div>

                                <div className="solicitud-wrapper">
                                    {previewingTemplate?.layoutType === 'structured_solicitud' ? (
                                        <div className="space-y-4">
                                            <div className="text-right font-black uppercase mb-8 text-[11pt]" dangerouslySetInnerHTML={{ __html: getProcessedText(previewingTemplate.sumilla || '') }} />
                                            
                                            <div className="mb-8">
                                                <h4 className="font-black uppercase text-[11pt]">SEÑOR {previewingTemplate.addresseeRole || '---'}:</h4>
                                                <p className="font-bold">{dummyData['{instituto_nombre}']}</p>
                                            </div>

                                            <div className="text-justify text-[11pt] leading-loose mb-6">
                                                Yo, <span className="font-black" dangerouslySetInnerHTML={{ __html: dummyData['{nombre_completo}'] }} />, 
                                                identificado con DNI N° <span className="font-mono font-bold" dangerouslySetInnerHTML={{ __html: dummyData['{dni}'] }} />, 
                                                estudiante del programa de estudios de <span className="font-bold" dangerouslySetInnerHTML={{ __html: dummyData['{carrera}'] }} />, 
                                                perteneciente al <span className="font-bold" dangerouslySetInnerHTML={{ __html: dummyData['{ciclo_actual}'] }} />, 
                                                turno <span className="font-bold" dangerouslySetInnerHTML={{ __html: dummyData['{turno}'] }} />, 
                                                con domicilio en <span className="font-bold" dangerouslySetInnerHTML={{ __html: dummyData['{direccion}'] }} />, ante usted con el debido respeto me presento y expongo:
                                            </div>

                                            <div className="text-justify leading-loose text-[11pt] min-h-[200px]" dangerouslySetInnerHTML={{ __html: getProcessedText(previewingTemplate.content) }} />

                                            <div className="my-8 font-bold uppercase text-[11pt]">
                                                Por lo tanto:<br/>
                                                Espero acceda a mi solicitud por ser de justicia.
                                            </div>

                                            <div className="text-right mt-12 italic text-[10pt]">
                                                Dado en la sede institucional, a los <span dangerouslySetInnerHTML={{ __html: dummyData['{fecha_hoy}'] }} />
                                                <br/>Hora de emisión: <span dangerouslySetInnerHTML={{ __html: dummyData['{hora_hoy}'] }} />
                                            </div>

                                            <div className="mt-20 pt-2 border-t border-black w-64 mx-auto text-center">
                                                <p className="font-black uppercase text-[10pt]" dangerouslySetInnerHTML={{ __html: dummyData['{nombre_completo}'] }} />
                                                <span className="text-[8pt] font-bold text-gray-500 uppercase tracking-widest">DNI: <span dangerouslySetInnerHTML={{ __html: dummyData['{dni}'] }} /></span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            className="text-[11pt] text-justify whitespace-pre-wrap leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: getProcessedText(previewingTemplate?.content || '') }} 
                                        />
                                    )}
                                </div>

                                <div className="absolute bottom-8 left-8 right-8 text-center text-[8pt] text-gray-400 border-t border-gray-100 pt-4 italic">
                                    Este documento tiene validez oficial bajo la normativa de acreditación tecnológica modular.
                                </div>
                            </Card>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 bg-white border-t flex gap-3 shrink-0">
                        <div className="flex-1 flex items-center gap-2 text-[10px] text-muted-foreground italic font-medium">
                            <Info className="h-4 w-4" />
                            El diseño estructurado inyecta automáticamente los datos del carnet RFID para mayor rapidez.
                        </div>
                        <Button variant="ghost" onClick={() => setPreviewingTemplate(null)} className="font-bold rounded-xl h-10 px-8">CERRAR VISOR</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog para confirmar eliminación */}
            <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase text-primary">¿Eliminar Diseño?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-slate-600">
                            Esta acción es irreversible y el documento dejará de estar disponible en los terminales Point Print. 
                            Se borrará permanentemente la plantilla: <strong>{templateToDelete?.name}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold h-11" onClick={() => setTemplateToDelete(null)}>CANCELAR</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black h-11">ELIMINAR PERMANENTE</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}