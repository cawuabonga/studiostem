
'use client';

/**
 * @fileOverview Gestor de Plantillas EDA rediseñado.
 * Utiliza un enfoque de catálogo por categorías y modelos predefinidos.
 * Incluye el modelo maestro de "Justificación de Inasistencias" con estructura rígida.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getDocumentTemplates, saveDocumentTemplate } from '@/services/eda-service';
import { getPaymentConcepts } from '@/config/firebase';
import type { DocumentTemplate, PaymentConcept, DocumentCategory } from '@/types';
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
    FileText, 
    ArrowLeft, 
    Eye, 
    Save, 
    CheckCircle2, 
    ChevronRight,
    FileStack,
    GraduationCap,
    Stamp,
    Layout,
    CheckCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- Esquema de Validación para el Editor de Solicitudes ---
const solicitudSchema = z.object({
  name: z.string().min(5, 'El nombre debe ser descriptivo.'),
  sumilla: z.string().min(5, 'La sumilla es obligatoria.'),
  addresseeRole: z.string().min(3, 'Especifique el cargo del destinatario.'),
  content: z.string().min(20, 'El cuerpo de la solicitud es requerido.'),
  requirementType: z.enum(['Gratuito', 'Pago Validado']),
  requirementValue: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SolicitudFormValues = z.infer<typeof solicitudSchema>;

// --- Tipos de Vista ---
type ViewState = 'categories' | 'models' | 'editor';

export function TemplateManager() {
    const { instituteId, institute } = useAuth();
    const { toast } = useToast();
    
    const [view, setView] = useState<ViewState>('categories');
    const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [concepts, setConcepts] = useState<PaymentConcept[]>([]);
    const [activeTemplate, setActiveTemplate] = useState<DocumentTemplate | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<SolicitudFormValues>({
        resolver: zodResolver(solicitudSchema),
        defaultValues: {
            isActive: true,
            requirementType: 'Gratuito'
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
            toast({ title: "Error", description: "No se pudieron cargar las plantillas.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSelectCategory = (cat: DocumentCategory) => {
        setSelectedCategory(cat);
        setView('models');
    };

    const handleOpenEditor = (template: DocumentTemplate) => {
        setActiveTemplate(template);
        form.reset({
            name: template.name,
            sumilla: template.sumilla || '',
            addresseeRole: template.addresseeRole || '',
            content: template.content,
            requirementType: template.requirementType,
            requirementValue: template.requirementValue || '',
            isActive: template.isActive ?? true,
        });
        setView('editor');
    };

    const onSubmit = async (data: SolicitudFormValues) => {
        if (!instituteId || !activeTemplate) return;
        setIsSubmitting(true);
        try {
            await saveDocumentTemplate(instituteId, { 
                ...data,
                category: activeTemplate.category,
                layoutType: 'structured_solicitud',
                variables: ['{nombre_completo}', '{dni}', '{carrera}', '{ciclo_actual}', '{turno}', '{direccion}', '{fecha_hoy}'],
                instituteId 
            }, activeTemplate.id);

            toast({ title: "Cambios Guardados", description: "La plantilla oficial ha sido actualizada." });
            fetchData();
        } catch (error) {
            toast({ title: "Error al guardar", variant: "destructive" });
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
    };

    if (loading) return <Skeleton className="h-64 w-full rounded-3xl" />;

    // --- VISTA 1: CATEGORÍAS PRINCIPALES ---
    if (view === 'categories') {
        return (
            <div className="grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card 
                    className="group cursor-pointer hover:border-primary hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden border-primary/5 bg-white"
                    onClick={() => handleSelectCategory('Solicitud')}
                >
                    <CardHeader className="p-8">
                        <div className="p-4 w-fit rounded-2xl bg-blue-50 text-blue-600 mb-6 transition-transform group-hover:scale-110">
                            <FileStack className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">SOLICITUDES</CardTitle>
                        <CardDescription className="text-sm font-medium leading-relaxed">
                            Modelos estructurados para trámites de alumnos: Justificaciones, Permisos, Retiros.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="px-8 pb-8 pt-0 flex items-center gap-2 text-xs font-black uppercase text-primary tracking-widest">
                        EXPLORAR CATEGORÍA <ChevronRight className="h-4 w-4" />
                    </CardFooter>
                </Card>

                {['Constancia', 'Ficha'].map((cat) => (
                    <Card key={cat} className="opacity-50 grayscale border-dashed cursor-not-allowed rounded-[2.5rem]">
                        <CardHeader className="p-8">
                            <div className="p-4 w-fit rounded-2xl bg-slate-100 text-slate-400 mb-6">
                                <Stamp className="h-10 w-10" />
                            </div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-400">{cat.toUpperCase()}S</CardTitle>
                            <CardDescription>Módulo en desarrollo para la próxima actualización.</CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        );
    }

    // --- VISTA 2: MODELOS DENTRO DE UNA CATEGORÍA ---
    if (view === 'models') {
        const filteredTemplates = templates.filter(t => t.category === selectedCategory);

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setView('categories')} className="font-bold hover:bg-primary/10">
                        <ArrowLeft className="mr-2 h-4 w-4" /> VOLVER A CATEGORÍAS
                    </Button>
                    <Separator orientation="vertical" className="h-8" />
                    <h3 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <FileStack className="h-5 w-5" /> MODELOS DE {selectedCategory?.toUpperCase()}
                    </h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Modelo Maestro: Justificación de Inasistencias */}
                    {selectedCategory === 'Solicitud' && (
                        <Card className="group hover:border-primary/40 hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden flex flex-col border-primary/5 bg-white border-2">
                            <CardHeader className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge className="bg-primary text-white uppercase font-black text-[9px] px-3">Modelo Oficial</Badge>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase">Estructurado</Badge>
                                </div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight leading-tight">
                                    Justificación de Inasistencias
                                </CardTitle>
                                <CardDescription className="text-xs font-medium mt-2">
                                    Documento formal para justificar faltas por motivos de salud o fuerza mayor.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="p-6 pt-0 mt-auto flex gap-2">
                                <Button 
                                    className="w-full font-black uppercase text-xs h-10 shadow-lg"
                                    onClick={() => {
                                        // Buscar si ya existe en la DB o crear localmente el objeto para el editor
                                        const existing = templates.find(t => t.name.includes('Justificación'));
                                        if (existing) handleOpenEditor(existing);
                                        else handleOpenEditor({
                                            id: 'new_justificacion',
                                            name: 'Solicitud de Justificación de Inasistencias',
                                            category: 'Solicitud',
                                            layoutType: 'structured_solicitud',
                                            sumilla: 'SOLICITO: Justificación de inasistencias.',
                                            addresseeRole: 'Coordinador del Programa de Estudios',
                                            content: 'Por intermedio de la presente, me dirijo a su despacho para solicitar la justificación de mis inasistencias a clases ocurridas durante los días...',
                                            requirementType: 'Gratuito',
                                            isActive: true,
                                            variables: [],
                                            createdAt: null as any,
                                            instituteId: instituteId!
                                        });
                                    }}
                                >
                                    GESTIONAR DISEÑO <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* Placeholder para otros modelos */}
                    <div className="border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-center opacity-30">
                        <PlusCircle className="h-10 w-10 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Próximos Modelos</p>
                        <p className="text-[10px] mt-1">Solicitud de Examen, Retiro, etc.</p>
                    </div>
                </div>
            </div>
        );
    }

    // --- VISTA 3: EDITOR ESPECÍFICO ---
    if (view === 'editor' && activeTemplate) {
        return (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setView('models')} className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-primary">{activeTemplate.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Editor de Estructura Institucional</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="font-bold rounded-xl border-2">
                            <Eye className="mr-2 h-4 w-4" /> PREVISUALIZAR A4
                        </Button>
                        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="font-black rounded-xl px-8 shadow-xl shadow-primary/20">
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                            GUARDAR CAMBIOS
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                        <Card className="rounded-[2rem] shadow-lg border-none overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b p-8">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary">Cuerpo del Documento</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <Form {...form}>
                                    <form className="space-y-8">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="sumilla" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-black text-[10px] uppercase text-slate-500">I. Sumilla (Asunto)</FormLabel>
                                                    <FormControl><Input {...field} className="h-12 font-bold uppercase rounded-xl border-primary/10" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                            <FormField control={form.control} name="addresseeRole" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-black text-[10px] uppercase text-slate-500">II. Dirigido a</FormLabel>
                                                    <FormControl><Input {...field} className="h-12 uppercase rounded-xl border-primary/10" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                        </div>

                                        <FormField control={form.control} name="content" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-black text-[10px] uppercase text-slate-500">III. Argumentación (Contenido)</FormLabel>
                                                <FormControl><Textarea rows={12} {...field} className="resize-none leading-relaxed font-medium text-base bg-slate-50 rounded-2xl p-6" /></FormControl>
                                                <FormDescription className="text-[10px]">Escriba solo los párrafos centrales. El sistema añadirá automáticamente la despedida reglamentaria.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <Card className="rounded-3xl shadow-md border-none bg-primary/5">
                            <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest">Requisitos de Emisión</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="requirementType" render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Gratuito">Gratuito</SelectItem>
                                                <SelectItem value="Pago Validado">Requiere Pago</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}/>
                                {form.watch('requirementType') === 'Pago Validado' && (
                                    <FormField control={form.control} name="requirementValue" render={({ field }) => (
                                        <FormItem className="animate-in zoom-in-95">
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Vincular Tasa..." /></SelectTrigger></FormControl>
                                                <SelectContent>{concepts.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}/>
                                )}
                            </CardContent>
                        </Card>

                        <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-200 rounded-3xl flex gap-4 items-start">
                            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-1" />
                            <div className="text-[11px] text-blue-800 leading-relaxed font-medium">
                                <p className="font-black uppercase mb-1">Estructura Automática:</p>
                                Este modelo inyecta automáticamente los datos del alumno (DNI, Carrera, etc.) y la firma oficial al final del documento.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dialog: Previsualización Institucional */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                        <DialogHeader className="p-6 bg-slate-100 border-b shrink-0 flex flex-row items-center justify-between pr-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Eye className="h-5 w-5" /></div>
                                <div><DialogTitle className="text-lg font-black uppercase tracking-tight text-primary">Previsualización de Impresión</DialogTitle><DialogDescription className="text-xs font-bold">Simulación de papel A4 oficial con datos de prueba.</DialogDescription></div>
                            </div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 uppercase font-black text-[9px]">Documento Estructurado</Badge>
                        </DialogHeader>

                        <ScrollArea className="flex-1 bg-slate-50">
                            <div className="p-12">
                                <Card className="max-w-[210mm] mx-auto min-h-[297mm] shadow-2xl border-none p-[25mm] bg-white rounded-none relative overflow-hidden text-black leading-relaxed font-sans">
                                    {/* Encabezado */}
                                    <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-10">
                                        <div className="flex items-center gap-4">
                                            {institute?.logoUrl && <img src={institute.logoUrl} alt="Logo" className="w-[65px] h-[65px] object-contain" />}
                                            <div className="text-left">
                                                <h1 className="text-[13pt] font-black uppercase leading-tight">{institute?.name}</h1>
                                                <p className="text-[8pt] text-gray-500 uppercase tracking-widest font-bold">Secretaría Académica • EDA System</p>
                                            </div>
                                        </div>
                                        <div className="text-right text-[7pt] font-black text-gray-400 uppercase tracking-widest">Validez Digital Verificada</div>
                                    </div>

                                    {/* Sumilla */}
                                    <div className="text-right mb-12">
                                        <p className="text-[11pt] font-black uppercase inline-block border-b-2 border-black pb-0.5">
                                            {form.watch('sumilla')}
                                        </p>
                                    </div>

                                    {/* Destinatario */}
                                    <div className="mb-10 space-y-1">
                                        <p className="font-black text-[11pt] uppercase">SEÑOR {form.watch('addresseeRole')}:</p>
                                        <p className="font-bold text-[11pt] uppercase">{institute?.name}</p>
                                    </div>

                                    {/* Cuerpo con Datos */}
                                    <div className="text-justify text-[11pt] leading-loose mb-8">
                                        Yo, <span className="font-black underline bg-yellow-50">{dummyData.name}</span>, 
                                        identificado con DNI N° <span className="font-mono font-bold bg-yellow-50">{dummyData.dni}</span>, 
                                        estudiante del programa de estudios de <span className="font-bold bg-yellow-50">{dummyData.program}</span>, 
                                        perteneciente al <span className="font-bold bg-yellow-50">{dummyData.semester}</span>, 
                                        turno <span className="font-bold bg-yellow-50">{dummyData.turno}</span>, 
                                        con domicilio en <span className="font-bold bg-yellow-50">{dummyData.address}</span>, 
                                        ante usted con el debido respeto me presento y expongo:
                                    </div>

                                    <div className="text-justify leading-relaxed text-[11pt] min-h-[300px] whitespace-pre-wrap font-medium py-4">
                                        {form.watch('content')}
                                    </div>

                                    <div className="my-10 font-bold uppercase text-[11pt]">
                                        Por lo tanto:<br/>
                                        Espero acceda a mi solicitud por ser de justicia.
                                    </div>

                                    <div className="text-right mt-12 italic text-[10pt] text-gray-700">
                                        Dado en la sede institucional, a los <span className="bg-yellow-50 font-bold">{dummyData.date}</span>.
                                    </div>

                                    <div className="mt-24 pt-2 border-t border-black w-72 mx-auto text-center">
                                        <p className="font-black uppercase text-[10pt] tracking-tight">{dummyData.name}</p>
                                        <span className="text-[8pt] font-black text-gray-500 uppercase tracking-widest">DNI: {dummyData.dni}</span>
                                    </div>
                                </Card>
                            </div>
                        </ScrollArea>

                        <DialogFooter className="p-6 bg-white border-t shrink-0">
                            <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="font-bold rounded-xl h-11 px-8">CERRAR VISOR</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return null;
}
