
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
    DialogFooter 
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
    DollarSign,
    Eye,
    Layout,
    Save,
    CheckCircle2,
    Clock,
    UserCircle
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

const templateSchema = z.object({
  name: z.string().min(5, 'El nombre debe ser descriptivo.'),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  layoutType: z.enum(['structured_solicitud', 'raw_html'] as const),
  sumilla: z.string().min(10, 'La sumilla es obligatoria para solicitudes.'),
  addresseeRole: z.string().min(3, 'Especifique a quién va dirigido el documento.'),
  content: z.string().min(20, 'El cuerpo de la solicitud es requerido.'),
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
        defaultValues: { 
            isActive: true, 
            requirementType: 'Gratuito', 
            layoutType: 'structured_solicitud',
            addresseeRole: 'Coordinador de Programa de Estudios',
            sumilla: 'SOLICITO: Justificación de inasistencias por salud.'
        }
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
        if (template) {
            setEditingTemplate(template);
            form.reset({
                name: template.name,
                category: template.category,
                layoutType: template.layoutType,
                sumilla: template.sumilla || '',
                addresseeRole: template.addresseeRole || '',
                content: template.content,
                requirementType: template.requirementType,
                requirementValue: template.requirementValue || '',
                isActive: template.isActive ?? true,
            });
        } else {
            setEditingTemplate(null);
            form.reset({
                name: '',
                category: 'Solicitud',
                layoutType: 'structured_solicitud',
                sumilla: 'SOLICITO: Justificación de inasistencias.',
                addresseeRole: 'Coordinador de Programa de Estudios',
                content: 'Por medio de la presente, solicito a su despacho la justificación de mis inasistencias ocurridas durante los días...',
                requirementType: 'Gratuito',
                requirementValue: '',
                isActive: true,
            });
        }
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: FormValues) => {
        if (!instituteId) return;
        setIsSubmitting(true);
        try {
            await saveDocumentTemplate(instituteId, { 
                ...data, 
                variables: ['{nombre_completo}', '{dni}', '{carrera}', '{ciclo_actual}', '{turno}', '{direccion}', '{fecha_hoy}', '{hora_hoy}'],
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
        setIsSubmitting(true);
        try {
            await deleteDocumentTemplate(instituteId, templateToDelete.id);
            toast({ title: "Diseño Eliminado", description: "La plantilla ha sido borrada." });
            setTemplateToDelete(null);
            fetchData();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Datos simulados para previsualización
    const dummyData = {
        name: 'ALEXANDER GUSTAVO PÉREZ RIVAS',
        dni: '76543210',
        program: 'ARQUITECTURA DE PLATAFORMAS Y TI',
        semester: 'V SEMESTRE',
        turno: 'MAÑANA',
        address: 'AV. LAS PALMERAS 456, DISTRITO DE CASTILLA',
        date: new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
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
                                <CardDescription className="text-xs font-bold text-primary italic mt-2">
                                    {template.sumilla}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="border-t bg-muted/20 p-4 flex gap-2 mt-auto">
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

            {/* Dialog: Registro/Edición */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                                <Layout className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                    Editor de Solicitudes EDA
                                </DialogTitle>
                                <DialogDescription className="text-primary-foreground/80 font-medium">Configure los parámetros fijos y el cuerpo de la solicitud.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
                            <ScrollArea className="flex-1">
                                <div className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Nombre Interno del Diseño</FormLabel><FormControl><Input placeholder="Ej: Solicitud de Justificación v2" {...field} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name="category" render={({ field }) => (
                                            <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">Categoría de Documento</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
                                        )}/>
                                    </div>

                                    <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="sumilla" render={({ field }) => (
                                                <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">I. Sumilla (Asunto)</FormLabel><FormControl><Input placeholder="SOLICITO: ..." {...field} className="h-11 rounded-xl font-bold border-primary/10" /></FormControl><FormMessage /></FormItem>
                                            )}/>
                                            <FormField control={form.control} name="addresseeRole" render={({ field }) => (
                                                <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">II. Dirigido a (Cargo Destino)</FormLabel><FormControl><Input placeholder="Ej: Director General / Coordinador Académico" {...field} className="h-11 rounded-xl uppercase border-primary/10" /></FormControl><FormMessage /></FormItem>
                                            )}/>
                                        </div>

                                        <FormField control={form.control} name="content" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-black text-[10px] uppercase tracking-widest text-primary">III. Cuerpo de la Solicitud (Argumentación)</FormLabel>
                                                <FormControl><Textarea rows={8} placeholder="Escriba aquí los párrafos centrales..." {...field} className="resize-none leading-relaxed font-medium bg-white rounded-2xl" /></FormControl>
                                                <FormDescription className="text-[10px]">Los datos del alumno (DNI, Carrera, etc.) se inyectan automáticamente en el encabezado.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><DollarSign className="h-4 w-4" /> Requisitos de Emisión</h4>
                                            <FormField control={form.control} name="requirementType" render={({ field }) => (
                                                <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl><SelectContent>{REQUIREMENTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></FormItem>
                                            )}/>
                                            {form.watch('requirementType') === 'Pago Validado' && (
                                                <FormField control={form.control} name="requirementValue" render={({ field }) => (
                                                    <FormItem className="animate-in zoom-in-95"><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11"><SelectValue placeholder="Vincular Tasa..." /></SelectTrigger></FormControl><SelectContent>{concepts.map(c => <SelectItem key={c.id} value={c.name}>{c.name} (S/ {c.amount})</SelectItem>)}</SelectContent></Select></FormItem>
                                                )}/>
                                            )}
                                        </div>
                                        <FormField control={form.control} name="isActive" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-2xl border p-4 bg-muted/20">
                                                <div className="space-y-0.5"><FormLabel className="text-xs font-bold">Documento Activo</FormLabel><p className="text-[10px] text-muted-foreground">Si está desactivado no aparecerá en el Point Print.</p></div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}/>
                                    </div>
                                </div>
                            </ScrollArea>

                            <DialogFooter className="p-8 bg-muted/50 border-t shrink-0 flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold rounded-xl h-12 flex-1">CANCELAR</Button>
                                <Button type="submit" disabled={isSubmitting} className="font-black rounded-xl h-12 flex-[2] shadow-xl shadow-primary/20">
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5 mr-2" />}
                                    {editingTemplate ? 'GUARDAR CAMBIOS' : 'PUBLICAR DISEÑO OFICIAL'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Dialog: Previsualización Institucional */}
            <Dialog open={!!previewingTemplate} onOpenChange={open => !open && setPreviewingTemplate(null)}>
                <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-100 border-b shrink-0 flex flex-row items-center justify-between pr-10">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Eye className="h-5 w-5" /></div>
                            <div><DialogTitle className="text-lg font-black uppercase tracking-tight text-primary">Previsualización de Impresión</DialogTitle><DialogDescription className="text-xs font-bold">Simulación de papel A4 oficial con datos de prueba.</DialogDescription></div>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 uppercase font-black text-[9px]">Dato de Prueba</Badge>
                    </DialogHeader>

                    <ScrollArea className="flex-1 bg-slate-50">
                        <div className="p-12">
                            {/* Papel A4 Simulado */}
                            <Card className="max-w-[210mm] mx-auto min-h-[297mm] shadow-2xl border-none p-[25mm] bg-white rounded-none relative overflow-hidden text-black leading-relaxed font-sans">
                                
                                {/* 1. Encabezado */}
                                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-10">
                                    <div className="flex items-center gap-4">
                                        {institute?.logoUrl && <img src={institute.logoUrl} alt="Logo" className="w-[65px] h-[65px] object-contain" />}
                                        <div className="text-left">
                                            <h1 className="text-[13pt] font-black uppercase leading-tight">{institute?.name}</h1>
                                            <p className="text-[8pt] text-gray-500 uppercase tracking-widest font-bold">Secretaría Académica • EDA System</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-[7pt] font-black text-gray-400 uppercase tracking-widest">Documento con Validez Digital</div>
                                </div>

                                {/* 2. Sumilla */}
                                <div className="text-right mb-12">
                                    <p className="text-[11pt] font-black uppercase inline-block border-b-2 border-black pb-0.5">
                                        {previewingTemplate?.sumilla || 'SOLICITO: ---'}
                                    </p>
                                </div>

                                {/* 3. Destinatario */}
                                <div className="mb-10 space-y-1">
                                    <p className="font-black text-[11pt] uppercase">SEÑOR {previewingTemplate?.addresseeRole || '---'}:</p>
                                    <p className="font-bold text-[11pt] uppercase">{institute?.name || '---'}</p>
                                </div>

                                {/* 4. Identificación del Alumno */}
                                <div className="text-justify text-[11pt] leading-loose mb-8">
                                    Yo, <span className="font-black underline bg-yellow-50">{dummyData.name}</span>, 
                                    identificado con DNI N° <span className="font-mono font-bold bg-yellow-50">{dummyData.dni}</span>, 
                                    estudiante del programa de estudios de <span className="font-bold bg-yellow-50">{dummyData.program}</span>, 
                                    perteneciente al <span className="font-bold bg-yellow-50">{dummyData.semester}</span>, 
                                    turno <span className="font-bold bg-yellow-50">{dummyData.turno}</span>, 
                                    con domicilio en <span className="font-bold bg-yellow-50">{dummyData.address}</span>, 
                                    ante usted con el debido respeto me presento y expongo:
                                </div>

                                {/* 5. Cuerpo */}
                                <div className="text-justify leading-relaxed text-[11pt] min-h-[300px] whitespace-pre-wrap font-medium py-4">
                                    {previewingTemplate?.content}
                                </div>

                                {/* 6. Despedida Fija */}
                                <div className="my-10 font-bold uppercase text-[11pt]">
                                    Por lo tanto:<br/>
                                    Espero acceda a mi solicitud por ser de justicia.
                                </div>

                                {/* 7. Lugar y Fecha */}
                                <div className="text-right mt-12 italic text-[10pt] text-gray-700">
                                    Dado en la sede institucional, a los <span className="bg-yellow-50 font-bold">{dummyData.date}</span>.
                                    <br/>Hora de emisión: <span className="bg-yellow-50 font-mono text-[9pt]">{dummyData.time}</span>
                                </div>

                                {/* 8. Firma */}
                                <div className="mt-24 pt-2 border-t border-black w-72 mx-auto text-center">
                                    <p className="font-black uppercase text-[10pt] tracking-tight">{dummyData.name}</p>
                                    <span className="text-[8pt] font-black text-gray-500 uppercase tracking-widest">DNI: {dummyData.dni}</span>
                                </div>

                                {/* 9. Footer */}
                                <div className="absolute bottom-10 left-10 right-10 text-center text-[7.5pt] text-gray-400 border-t border-gray-100 pt-4 italic">
                                    Este documento es generado automáticamente por el sistema EDA (Elaboración de Documentos Automáticos) 
                                    y tiene validez legal bajo la certificación tecnológica de {institute?.name}.
                                </div>
                            </Card>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 bg-white border-t shrink-0">
                        <Button variant="ghost" onClick={() => setPreviewingTemplate(null)} className="font-bold rounded-xl h-11 px-8">CERRAR VISOR</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!templateToDelete} onOpenChange={open => !open && setTemplateToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase text-primary">¿Eliminar este diseño?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-slate-600">
                            Esta acción es irreversible y el documento dejará de estar disponible en los terminales táctiles Point Print.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold h-11">CANCELAR</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black h-11">
                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'ELIMINAR PERMANENTE'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

