'use client';

/**
 * @fileOverview Componente Maestro del Kiosko EDA (Point Print).
 * Interfaz táctil de alta fidelidad optimizada para trámites físicos.
 * Sincronizado dinámicamente con el color primario del instituto.
 * Soporta imágenes de fondo personalizadas por cada terminal.
 * Incluye modo de entrada manual para facilitar pruebas sin hardware RFID.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { listenToPrintPoint, closeKioskSession, getDocumentTemplates } from '@/services/eda-service';
import { getStudentProfile, getInstitute, getStaffProfiles, getStudentPaymentsByStatus, getPrograms } from '@/config/firebase';
import type { PrintPoint, StudentProfile, DocumentTemplate, Institute, StaffProfile, Program } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { 
    Fingerprint, 
    Loader2, 
    LogOut, 
    FileStack, 
    ChevronRight, 
    ArrowLeft, 
    CheckCircle2, 
    AlertTriangle, 
    Printer, 
    Info,
    CalendarDays,
    Stamp,
    CreditCard,
    Keyboard,
    UserCircle,
    FileText,
    Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

interface KioskViewProps {
    pointId: string;
    instituteId: string;
}

type KioskStep = 'idle' | 'menu' | 'category' | 'assistant' | 'validation' | 'preview';

export function KioskView({ pointId, instituteId }: KioskViewProps) {
    const { toast } = useToast();
    const [point, setPoint] = useState<PrintPoint | null>(null);
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [institute, setInstitute] = useState<Institute | null>(null);
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [staff, setStaff] = useState<StaffProfile[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    
    // UI state
    const [step, setStep] = useState<KioskStep>('idle');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [manualDni, setManualDni] = useState('');

    // Form flow state
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // 1. Escuchar el Punto de Impresión
    useEffect(() => {
        if (!instituteId || !pointId) return;
        const unsub = listenToPrintPoint(instituteId, pointId, (p) => {
            setPoint(p);
            if (p?.currentStudentId) {
                loadStudentSession(p.currentStudentId);
            } else {
                setStudent(null);
                setStep('idle');
            }
        });
        return () => unsub();
    }, [instituteId, pointId]);

    // 2. Cargar datos base del instituto
    useEffect(() => {
        if (!instituteId) return;
        Promise.all([
            getInstitute(instituteId),
            getDocumentTemplates(instituteId),
            getStaffProfiles(instituteId),
            getPrograms(instituteId)
        ]).then(([inst, temps, staffList, progs]) => {
            setInstitute(inst);
            setTemplates(temps);
            setStaff(staffList);
            setPrograms(progs);
            setLoading(false);
        });
    }, [instituteId]);

    const loadStudentSession = async (sId: string) => {
        setLoading(true);
        const profile = await getStudentProfile(instituteId, sId);
        if (profile) {
            setStudent(profile);
            setStep('menu');
        }
        setLoading(false);
    };

    const handleManualLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualDni || !instituteId) return;
        setLoading(true);
        try {
            const profile = await getStudentProfile(instituteId, manualDni);
            if (profile) {
                setStudent(profile);
                setStep('menu');
                setManualDni('');
            } else {
                toast({ 
                    title: "No encontrado", 
                    description: "No existe un estudiante con ese DNI.", 
                    variant: "destructive" 
                });
            }
        } catch (e) {
            toast({ title: "Error", description: "Ocurrió un error en la búsqueda.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await closeKioskSession(instituteId, pointId);
        setStep('idle');
        setStudent(null);
    };

    const categories = useMemo(() => {
        const cats = new Set(templates.map(t => t.category));
        return Array.from(cats);
    }, [templates]);

    const handleSelectTemplate = (template: DocumentTemplate) => {
        setSelectedTemplate(template);
        setFormData({});
        setSelectedDates([]);
        setStep('assistant');
    };

    const handleFinalizeAssistant = async () => {
        if (!selectedTemplate || !student) return;
        
        setIsValidating(true);
        setValidationError(null);

        // Lógica de Validación Administrativa
        if (selectedTemplate.requirementType === 'Pago Validado') {
            try {
                const payments = await getStudentPaymentsByStatus(instituteId, student.documentId, 'Aprobado');
                const hasPayment = payments.some(p => p.concept === selectedTemplate.requirementValue);
                
                if (!hasPayment) {
                    setValidationError(`Este trámite requiere un pago validado de "${selectedTemplate.requirementValue}". Acérquese a Tesorería.`);
                    setStep('validation');
                    setIsValidating(false);
                    return;
                }
            } catch (e) {
                setValidationError("Error al validar requisitos. Reintente.");
                setStep('validation');
                setIsValidating(false);
                return;
            }
        }

        setStep('preview');
        setIsValidating(false);
    };

    // Resolver nombre del programa del estudiante
    const studentProgramName = useMemo(() => {
        if (!student || !programs.length) return student?.programId || '';
        return programs.find(p => p.id === student.programId)?.name || student.programId;
    }, [student, programs]);

    // --- LÓGICA DE BRANDING ---
    const primaryColor = institute?.primaryColor ? `hsl(${institute.primaryColor})` : undefined;

    if (loading && step === 'idle') {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            </div>
        );
    }

    // PANTALLA DE ESPERA (REPOSO)
    if (step === 'idle') {
        return (
            <div 
                className="h-screen flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000 relative overflow-hidden"
                style={{ backgroundColor: primaryColor || '#1e3a8a' }}
            >
                {/* FONDO PERSONALIZADO */}
                {point?.backgroundImageUrl ? (
                    <Image 
                        src={point.backgroundImageUrl} 
                        alt="Background" 
                        fill 
                        className="object-cover opacity-60"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                <div className="max-w-2xl space-y-12 relative z-10">
                    <div className="space-y-4">
                        <div className="relative h-48 w-48 mx-auto bg-white p-6 rounded-[3rem] shadow-2xl border-4 border-white/20 animate-in zoom-in duration-700">
                            {institute?.logoUrl ? (
                                <Image src={institute.logoUrl} alt="Logo" fill className="object-contain p-4" />
                            ) : (
                                <Fingerprint className="h-full w-full text-primary/20" />
                            )}
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none">
                            {institute?.name || 'CENTRO DE TRÁMITES'}
                        </h1>
                    </div>

                    <div className="bg-white/95 backdrop-blur-2xl p-10 rounded-[3.5rem] shadow-3xl border-2 border-white/50 space-y-6">
                        <div className="h-20 w-20 mx-auto bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
                            <Fingerprint className="h-10 w-10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tight text-primary">Identifíquese</h2>
                            <p className="text-xl font-medium text-slate-500">Pase su carnet RFID o ingrese su DNI debajo.</p>
                        </div>
                    </div>

                    {/* MODO MANUAL (PARA PRUEBAS) */}
                    <form onSubmit={handleManualLogin} className="pt-4 w-full max-w-xs mx-auto space-y-3">
                        <div className="relative">
                            <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                            <Input 
                                placeholder="DNI para pruebas..." 
                                value={manualDni}
                                onChange={e => setManualDni(e.target.value)}
                                className="bg-black/20 border-white/30 text-white placeholder:text-white/40 text-center h-14 rounded-2xl text-xl font-bold tracking-widest focus-visible:ring-white/20"
                            />
                        </div>
                        <Button 
                            type="submit" 
                            variant="secondary" 
                            className="w-full font-black uppercase text-xs tracking-widest h-14 rounded-2xl shadow-xl hover:scale-105 transition-transform"
                            disabled={!manualDni || loading}
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "INICIAR SESIÓN MANUAL"}
                        </Button>
                    </form>

                    <div className="pt-8">
                        <Badge variant="outline" className="bg-black/40 h-10 px-6 rounded-full border-white/10 text-white font-bold uppercase tracking-widest text-[10px] backdrop-blur-md">
                            Terminal: {point?.name || 'Local'} • Hard-ID: {pointId}
                        </Badge>
                    </div>
                </div>
            </div>
        );
    }

    // CABECERA DEL KIOSKO (USUARIO IDENTIFICADO)
    const KioskHeader = () => (
        <header className="bg-primary p-4 md:p-6 text-primary-foreground flex justify-between items-center shadow-xl shrink-0">
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 relative rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-white/10">
                    <Image src={student?.photoURL || `https://placehold.co/200x200.png?text=${student?.fullName?.[0] || 'S'}`} alt="" fill className="object-cover" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none">{student?.fullName}</h2>
                    <p className="text-xs md:text-sm font-bold text-white/70 uppercase tracking-widest mt-1">
                        DNI: {student?.documentId} • {studentProgramName}
                    </p>
                </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-white/10 hover:bg-white/20 text-white border-2 border-white/20">
                <LogOut className="h-6 w-6" />
            </Button>
        </header>
    );

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
            <KioskHeader />

            <main className="flex-1 overflow-hidden p-4 md:p-6">
                
                {/* VISTA: MENÚ PRINCIPAL */}
                {step === 'menu' && (
                    <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-8 duration-500 h-full flex flex-col justify-center">
                        <div className="text-center space-y-1">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-800">¿Qué trámite desea realizar?</h3>
                            <p className="text-lg text-slate-500 font-medium">Seleccione una categoría para ver los documentos disponibles.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map(cat => (
                                <Card 
                                    key={cat} 
                                    className="group cursor-pointer hover:border-primary hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] border-none shadow-lg bg-white overflow-hidden"
                                    onClick={() => { setSelectedCategory(cat); setStep('category'); }}
                                >
                                    <div className="p-8 flex flex-col items-center text-center space-y-4">
                                        <div className="p-5 bg-slate-50 text-primary rounded-[1.5rem] group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                            {cat === 'Solicitud' ? <FileStack className="h-10 w-10" /> : <Stamp className="h-10 w-10" />}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black uppercase tracking-tight leading-none">{cat}S</h4>
                                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                                {templates.filter(t => t.category === cat).length} Documentos
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-primary h-1.5 w-full scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* VISTA: LISTA DE MODELOS POR CATEGORÍA */}
                {step === 'category' && (
                    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
                        <Button variant="ghost" onClick={() => setStep('menu')} className="text-lg font-black uppercase h-12 px-6 rounded-xl hover:bg-slate-200 self-start">
                            <ArrowLeft className="mr-3 h-5 w-5" /> VOLVER
                        </Button>

                        <div className="grid gap-4 md:grid-cols-2">
                            {templates.filter(t => t.category === selectedCategory).map(temp => (
                                <Card 
                                    key={temp.id} 
                                    className="p-6 rounded-2xl border-none shadow-md hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer bg-white flex justify-between items-center group"
                                    onClick={() => handleSelectTemplate(temp)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/5 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-tight text-slate-800">{temp.name}</h4>
                                            <Badge variant={temp.requirementType === 'Gratuito' ? 'secondary' : 'outline'} className="mt-1 text-[8px] font-black uppercase tracking-widest border-primary/20">
                                                {temp.requirementType === 'Gratuito' ? 'GRATUITO' : `COSTO: ${temp.requirementValue}`}
                                            </Badge>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-8 w-8 text-slate-200 group-hover:text-primary transition-colors" />
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* VISTA: ASISTENTE DE TRÁMITE (PASO A PASO) - COMPACTADO PARA EVITAR SCROLL */}
                {step === 'assistant' && selectedTemplate && (
                    <div className="max-w-full mx-auto space-y-4 animate-in slide-in-from-bottom-8 duration-500 h-full flex flex-col overflow-hidden">
                         <div className="text-center space-y-0.5">
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Asistente de Documentación</h3>
                            <p className="text-xs text-slate-500 font-medium">Complete los pasos para generar su solicitud oficial.</p>
                        </div>

                        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden p-6 flex-1 min-h-0 flex flex-col">
                            {/* MODELO ESPECÍFICO: JUSTIFICACIÓN */}
                            {selectedTemplate.name.includes('Justificación') ? (
                                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                                    {/* PASO 1: MOTIVO (Fila Superior) */}
                                    <div className="space-y-2 shrink-0">
                                        <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <div className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] italic font-black">1</div>
                                            ¿Cuál es el motivo de su falta?
                                        </Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {['Salud', 'Personal', 'Trabajo', 'Familiar'].map(m => (
                                                <Button 
                                                    key={m} 
                                                    variant={formData['{motivo_justificacion}'] === m ? 'default' : 'outline'}
                                                    className={cn(
                                                        "h-10 text-xs font-black uppercase rounded-xl border-2 transition-all",
                                                        formData['{motivo_justificacion}'] === m ? "scale-105 shadow-md" : "opacity-60"
                                                    )}
                                                    onClick={() => setFormData({...formData, '{motivo_justificacion}': m})}
                                                >
                                                    {m}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* GRID PRINCIPAL: PASO 2 (Calendario) + PASO 3 (Adjuntos) + BOTONES */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                                        
                                        {/* COLUMNA IZQUIERDA: CALENDARIO */}
                                        <div className="lg:col-span-5 flex flex-col space-y-2 min-h-0">
                                            <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                <div className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] italic font-black">2</div>
                                                Seleccione las fechas
                                            </Label>
                                            <div className="bg-slate-50 p-2 rounded-2xl border-2 border-dashed border-slate-200 flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                                                <div className="bg-white p-2 rounded-xl shadow-md border scale-90 md:scale-100 origin-center">
                                                    <Calendar
                                                        mode="multiple"
                                                        selected={selectedDates}
                                                        onSelect={(dates) => {
                                                            setSelectedDates(dates);
                                                            if (dates && dates.length > 0) {
                                                                const formatted = dates
                                                                    .sort((a, b) => a.getTime() - b.getTime())
                                                                    .map(d => format(d, "EEEE dd 'de' MMMM", { locale: es }))
                                                                    .join(', ');
                                                                setFormData(prev => ({...prev, '{fechas_inasistencia}': formatted}));
                                                            } else {
                                                                setFormData(prev => ({...prev, '{fechas_inasistencia}': ''}));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* COLUMNA DERECHA: RESUMEN + PASO 3 + ACCIONES */}
                                        <div className="lg:col-span-7 flex flex-col space-y-4">
                                            
                                            {/* Resumen de días (Solo si hay selección) */}
                                            <div className="space-y-2 flex-1 flex flex-col min-h-0">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-primary" />
                                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Días Marcados:</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex-1 min-h-[60px] flex items-center justify-center text-center shadow-inner overflow-hidden">
                                                    {formData['{fechas_inasistencia}'] ? (
                                                        <ScrollArea className="h-full w-full">
                                                            <p className="text-[11px] font-bold text-primary uppercase leading-tight p-2">
                                                                {formData['{fechas_inasistencia}']}
                                                            </p>
                                                        </ScrollArea>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">Toque los días en el calendario a la izquierda...</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* PASO 3: ADJUNTOS */}
                                            <div className="space-y-2 shrink-0">
                                                <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                    <div className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] italic font-black">3</div>
                                                    ¿Presenta algún certificado físico?
                                                </Label>
                                                <div className="flex gap-2">
                                                    {[
                                                        {v: 'SI', label: 'SÍ, ADJUNTO', icon: CheckCircle2},
                                                        {v: 'NO', label: 'NO, DECLARACIÓN', icon: AlertTriangle}
                                                    ].map(opt => (
                                                        <Button 
                                                            key={opt.v} 
                                                            variant={formData['{adjuntos_detalle}'] && formData['{adjuntos_detalle}'].includes(opt.v === 'SI' ? 'POR LO CUAL' : 'SOLICITO') ? 'default' : 'outline'}
                                                            className={cn(
                                                                "flex-1 h-11 text-[10px] font-black uppercase rounded-xl border-2 gap-2 transition-all",
                                                                (formData['{adjuntos_detalle}'] && formData['{adjuntos_detalle}'].includes(opt.v === 'SI' ? 'POR LO CUAL' : 'SOLICITO')) ? "bg-primary text-white scale-[1.02]" : "opacity-60"
                                                            )}
                                                            onClick={() => setFormData({...formData, '{adjuntos_detalle}': opt.v === 'SI' ? 'POR LO CUAL ADJUNTO EL CERTIFICADO CORRESPONDIENTE' : 'SOLICITO SE CONSIDERE MI PALABRA BAJO DECLARACIÓN JURADA'})}
                                                        >
                                                            <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* BOTONES DE ACCIÓN (Integrados en la columna derecha) */}
                                            <div className="pt-4 border-t flex gap-3">
                                                <Button variant="ghost" onClick={() => setStep('category')} className="h-12 flex-1 text-xs font-black uppercase rounded-xl border-2">CANCELAR</Button>
                                                <Button 
                                                    disabled={!formData['{motivo_justificacion}'] || !formData['{fechas_inasistencia}'] || !formData['{adjuntos_detalle}']}
                                                    onClick={handleFinalizeAssistant}
                                                    className="h-12 flex-[2] text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
                                                >
                                                    GENERAR DOCUMENTO <ChevronRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">Modelo en proceso de configuración.</div>
                            )}
                        </Card>
                    </div>
                )}

                {/* VISTA: VALIDACIÓN DE REQUISITOS (PAGO) */}
                {step === 'validation' && (
                    <div className="max-w-2xl mx-auto space-y-8 text-center animate-in zoom-in-95 duration-500 h-full flex flex-col justify-center">
                        <div className="h-32 w-32 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <CreditCard className="h-16 w-16" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-800">Trámite no autorizado</h3>
                            <div className="p-8 bg-white rounded-[2rem] shadow-xl border-2 border-red-200">
                                <p className="text-xl font-bold text-red-700 leading-tight">"{validationError}"</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                             <Button onClick={() => setStep('assistant')} variant="secondary" className="h-14 text-lg font-black rounded-xl">REINTENTAR VALIDACIÓN</Button>
                             <Button onClick={handleLogout} variant="ghost" className="h-12 font-bold text-slate-400 uppercase tracking-widest">FINALIZAR SESIÓN</Button>
                        </div>
                    </div>
                )}

                {/* VISTA: PREVISUALIZACIÓN Y FIRMA FINAL */}
                {step === 'preview' && selectedTemplate && (
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700 h-full overflow-hidden">
                        <div className="lg:col-span-8 overflow-y-auto custom-scrollbar">
                            <Card className="max-w-[210mm] mx-auto min-h-[297mm] border-none p-10 md:p-[20mm] bg-white rounded-none relative overflow-hidden text-black leading-relaxed font-sans shadow-2xl">
                                {/* Encabezado */}
                                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        {institute?.logoUrl && <img src={institute.logoUrl} alt="" className="w-12 h-12 object-contain" />}
                                        <div className="text-left leading-tight">
                                            <h1 className="text-[11pt] font-black uppercase">{institute?.name}</h1>
                                            <p className="text-[7pt] text-gray-500 uppercase tracking-widest font-bold">Secretaría Académica • EDA System</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-[6pt] font-black text-gray-400 uppercase tracking-widest">EXP-ID: {pointId}-{student?.documentId}</div>
                                </div>

                                {/* Sumilla */}
                                <div className="text-right mb-8">
                                    <p className="text-[10pt] font-black uppercase inline-block border-b-2 border-black pb-0.5">
                                        {selectedTemplate.sumilla?.replace(/{motivo_justificacion}/g, (formData['{motivo_justificacion}'] || '').toUpperCase())}
                                    </p>
                                </div>

                                {/* Destinatario */}
                                <div className="mb-8 space-y-1">
                                    <p className="font-black text-[10pt] uppercase leading-none">SEÑOR {selectedTemplate.addresseeType === 'Director' ? 'DIRECTOR GENERAL' : 'COORDINADOR DEL PROGRAMA DE ESTUDIOS'}:</p>
                                    <p className="font-bold text-[10pt] uppercase underline decoration-2 underline-offset-4">
                                        {selectedTemplate.addresseeType === 'Director' ? selectedTemplate.directorName : (staff.find(s => s.programId === student?.programId && (s.role === 'Coordinator' || s.roleId === 'coordinator'))?.displayName || 'COORDINADOR ACADÉMICO')}
                                    </p>
                                    <p className="font-bold text-[10pt] uppercase">{institute?.name}</p>
                                </div>

                                {/* Identidad */}
                                <div className="text-justify text-[10pt] leading-loose mb-6">
                                    Yo, <span className="font-black underline">{student?.fullName}</span>, 
                                    identificado con DNI N° <span className="font-mono font-bold">{student?.documentId}</span>, 
                                    estudiante del programa de estudios de <span className="font-bold">{studentProgramName}</span>, 
                                    perteneciente al <span className="font-bold">{student?.currentSemester || 1}° Semestre</span>, 
                                    turno <span className="font-bold">{student?.turno}</span>, 
                                    con domicilio en <span className="font-bold">{student?.address || '---'}</span>, 
                                    ante usted con el debido respeto me presento y expongo:
                                </div>

                                {/* Argumentación Dinámica Inyectada */}
                                <div className="text-justify leading-relaxed text-[10pt] min-h-[250px] whitespace-pre-wrap font-medium py-4 border-l-2 border-slate-100 pl-4 bg-slate-50/30">
                                    {selectedTemplate.content
                                        .replace(/{motivo_justificacion}/g, (formData['{motivo_justificacion}'] || '').toUpperCase())
                                        .replace(/{fechas_inasistencia}/g, (formData['{fechas_inasistencia}'] || '').toUpperCase())
                                        .replace(/{adjuntos_detalle}/g, formData['{adjuntos_detalle}'] || '')
                                    }
                                </div>

                                <div className="my-8 font-bold uppercase text-[10pt]">
                                    Por lo tanto:<br/>
                                    Espero acceda a mi solicitud por ser de justicia.
                                </div>

                                <div className="text-right mt-8 italic text-[9pt] text-gray-700">
                                    Dado en la sede institucional, a los {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}.
                                </div>

                                <div className="mt-16 pt-2 border-t border-black w-60 mx-auto text-center">
                                    <p className="font-black uppercase text-[9pt] tracking-tight">{student?.fullName}</p>
                                    <span className="text-[7pt] font-black text-gray-500 uppercase tracking-widest">DNI: {student?.documentId}</span>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-4">
                            <Card className="rounded-[2rem] border-none shadow-xl bg-primary text-primary-foreground p-6 space-y-4">
                                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Printer className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black uppercase tracking-tight">Confirmar e Imprimir</h4>
                                    <p className="text-xs text-white/70 font-medium mt-1">Revise su información. Al confirmar se generará un cargo oficial.</p>
                                </div>
                                <Button 
                                    className="w-full h-16 text-xl font-black uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/80 shadow-xl rounded-xl animate-pulse"
                                    onClick={() => {
                                        window.print();
                                        handleLogout();
                                        toast({ title: "Documento Enviado", description: "Iniciando proceso de impresión." });
                                    }}
                                >
                                    IMPRIMIR
                                </Button>
                            </Card>

                            <Button variant="ghost" onClick={() => setStep('assistant')} className="h-12 font-black uppercase rounded-xl border-2 border-slate-200">
                                <ArrowLeft className="mr-2 h-4 w-4" /> CORREGIR
                            </Button>

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 items-start">
                                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-800 leading-tight font-medium">
                                    Su solicitud será archivada digitalmente en su expediente de forma automática tras la impresión.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            
            {/* PIE DE PÁGINA FIXO KIOSKO - COMPACTO */}
            <footer className="p-2 text-center bg-white border-t text-[8px] font-black uppercase tracking-[0.3em] text-slate-300 shrink-0">
                STEM V2 • POINT PRINT SYSTEM • {new Date().getFullYear()}
            </footer>
        </div>
    );
}
