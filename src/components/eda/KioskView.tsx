
'use client';

/**
 * @fileOverview Componente Maestro del Kiosko EDA (Point Print).
 * Interfaz táctil de alta fidelidad optimizada para trámites físicos.
 * Sincronizado dinámicamente con el color primario del instituto.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { listenToPrintPoint, closeKioskSession, getDocumentTemplates, registerGenerationLog } from '@/services/eda-service';
import { getStudentProfile, getStaffProfileByDocumentId, getInstitute, getStaffProfiles, getStudentPaymentsByStatus, getPrograms } from '@/config/firebase';
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
    Paperclip,
    Send,
    ExternalLink,
    XCircle,
    Clock,
    Globe,
    ShieldCheck,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Timestamp } from 'firebase/firestore';

interface KioskViewProps {
    pointId: string;
    instituteId: string;
}

type KioskStep = 'idle' | 'menu' | 'category' | 'assistant' | 'validation' | 'preview';

export function KioskView({ pointId, instituteId: propInstituteId }: KioskViewProps) {
    const { toast } = useToast();
    const [point, setPoint] = useState<PrintPoint | null>(null);
    const [student, setStudent] = useState<any | null>(null);
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

    // Determinar ID de instituto efectivo (Prioriza el del terminal si ya está cargado)
    const effectiveInstituteId = point?.instituteId || propInstituteId;

    /**
     * Carga el perfil del alumno o personal detectado.
     * Soporta ambos tipos de perfil para máxima flexibilidad en el terminal.
     */
    const loadUserSession = useCallback(async (userId: string, instId: string) => {
        // Evitar recargas si el usuario ya es el mismo (previene parpadeo)
        if (student && student.documentId === userId) return;

        setLoading(true);
        console.log(`[KIOSKO] Cargando sesión para usuario: ${userId} en instituto: ${instId}`);
        
        try {
            // Intentamos cargar como estudiante primero
            let profile: any = await getStudentProfile(instId, userId);
            
            // Si no es estudiante, intentamos cargar como personal
            if (!profile) {
                profile = await getStaffProfileByDocumentId(instId, userId);
                if (profile) profile.isStaff = true;
            }

            if (profile) {
                setStudent(profile);
                setStep('menu');
            } else {
                console.error("[KIOSKO] Perfil no encontrado en la base de datos.");
                toast({ title: "Error de Perfil", description: "No se encontraron tus datos académicos.", variant: "destructive" });
            }
        } catch (error) {
            console.error("[KIOSKO] Error al cargar sesión:", error);
        } finally {
            setLoading(false);
        }
    }, [student, toast]);

    // 1. Escuchar el Punto de Impresión (Sincronización en Tiempo Real con Hardware)
    useEffect(() => {
        if (!propInstituteId || !pointId) return;

        const unsub = listenToPrintPoint(propInstituteId, pointId, (p) => {
            setPoint(p);
            
            if (p?.currentStudentId) {
                const targetInstId = p.instituteId || propInstituteId;
                loadUserSession(p.currentStudentId, targetInstId);
            } else {
                // Solo volvemos a idle si realmente se limpió la sesión
                if (student) {
                    setStudent(null);
                    setStep('idle');
                }
            }
        });
        return () => unsub();
    }, [propInstituteId, pointId, loadUserSession, student]);

    // 2. Cargar datos base del instituto para el funcionamiento del Kiosko
    useEffect(() => {
        if (!effectiveInstituteId) return;
        
        const loadBaseData = async () => {
            try {
                const [inst, temps, staffList, progs] = await Promise.all([
                    getInstitute(effectiveInstituteId),
                    getDocumentTemplates(effectiveInstituteId),
                    getStaffProfiles(effectiveInstituteId),
                    getPrograms(effectiveInstituteId)
                ]);
                setInstitute(inst);
                setTemplates(temps);
                setStaff(staffList);
                setPrograms(progs);
            } catch (error) {
                console.error("[KIOSKO] Error cargando datos base:", error);
            } finally {
                setLoading(false);
            }
        };

        loadBaseData();
    }, [effectiveInstituteId]);

    const handleManualLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualDni || !effectiveInstituteId) return;
        await loadUserSession(manualDni, effectiveInstituteId);
        setManualDni('');
    };

    const handleLogout = async () => {
        if (effectiveInstituteId) {
            await closeKioskSession(effectiveInstituteId, pointId);
        }
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

        if (selectedTemplate.requirementType === 'Pago Validado') {
            try {
                const payments = await getStudentPaymentsByStatus(effectiveInstituteId, student.documentId, 'Aprobado');
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

    const studentProgramName = useMemo(() => {
        if (!student || !programs.length) return student?.programId || '';
        return programs.find(p => p.id === student.programId)?.name || student.programId;
    }, [student, programs]);

    const coordinatorName = useMemo(() => {
        if (!student || !staff.length) return 'COORDINADOR ACADÉMICO';
        const coord = staff.find(s => s.programId === student.programId && (s.role === 'Coordinator' || s.roleId === 'coordinator'));
        return coord?.displayName || 'COORDINADOR ACADÉMICO';
    }, [student, staff]);

    const getFormattedContent = (text: string) => {
        return text
            .replace(/{motivo_justificacion}/g, `<span class="font-black underline">${(formData['{motivo_justificacion}'] || '').toUpperCase()}</span>`)
            .replace(/{fechas_inasistencia}/g, `<span class="font-black underline">${(formData['{fechas_inasistencia}'] || '').toUpperCase()}</span>`)
            .replace(/{adjuntos_detalle}/g, `<span class="font-black underline">${(formData['{adjuntos_detalle}'] || '').toUpperCase()}</span>`)
            .replace(/{fines_tramite}/g, `<span class="font-black underline">${(formData['{fines_tramite}'] || '').toUpperCase()}</span>`)
            .replace(/{ciclo_referencia}/g, `<span class="font-black underline">${(formData['{ciclo_referencia}'] || '').toUpperCase()}</span>`);
    };

    const getPrinterStatusColor = () => {
        if (!point?.printerStatus || point.printerStatus === 'Offline') return 'bg-red-100 text-red-700 border-red-200';
        if (point.paperStatus === 'Empty' || point.paperStatus === 'Jam') return 'bg-amber-100 text-amber-700 border-amber-200';
        if (point.tonerLevel !== undefined && point.tonerLevel < 10) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    const primaryColor = institute?.primaryColor ? `hsl(${institute.primaryColor})` : undefined;

    if (loading && step === 'idle') {
        return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" /></div>;
    }

    if (step === 'idle') {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden" style={{ backgroundColor: primaryColor || '#1e3a8a' }}>
                {point?.backgroundImageUrl ? (
                    <Image src={point.backgroundImageUrl} alt="Background" fill className="object-cover opacity-60" priority />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                <div className="max-w-2xl space-y-12 relative z-10">
                    <div className="space-y-4">
                        <div className="relative h-48 w-48 mx-auto bg-white p-6 rounded-[3rem] shadow-2xl border-4 border-white/20 animate-in zoom-in duration-700">
                            {institute?.logoUrl ? <Image src={institute.logoUrl} alt="Logo" fill className="object-contain p-4" /> : <Fingerprint className="h-full w-full text-primary/20" />}
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none">{institute?.name || 'CENTRO DE TRÁMITES'}</h1>
                    </div>
                    <div className="bg-white/95 backdrop-blur-2xl p-10 rounded-[3.5rem] shadow-3xl border-2 border-white/50 space-y-6">
                        <div className="h-20 w-20 mx-auto bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20"><Fingerprint className="h-10 w-10 text-white" /></div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tight text-primary">Identifíquese</h2>
                            <p className="text-xl font-medium text-slate-500">Pase su carnet RFID o ingrese su DNI debajo.</p>
                        </div>
                    </div>
                    <form onSubmit={handleManualLogin} className="pt-4 w-full max-w-xs mx-auto space-y-3">
                        <div className="relative">
                            <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                            <Input placeholder="Ingrese DNI..." value={manualDni} onChange={e => setManualDni(e.target.value)} className="bg-black/20 border-white/30 text-white placeholder:text-white/40 text-center h-14 rounded-2xl text-xl font-bold tracking-widest focus-visible:ring-white/20" />
                        </div>
                        <Button type="submit" variant="secondary" className="w-full font-black uppercase text-xs tracking-widest h-14 rounded-2xl shadow-xl hover:scale-105 transition-transform" disabled={!manualDni || loading}>
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "INICIAR SESIÓN MANUAL"}
                        </Button>
                    </form>
                    <div className="pt-8 flex flex-col items-center gap-2">
                        <Badge variant="outline" className="bg-black/40 h-10 px-6 rounded-full border-white/10 text-white font-bold uppercase tracking-widest text-[10px] backdrop-blur-md">
                            Terminal: {point?.name || 'Local'} • ID: {pointId}
                        </Badge>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible">
            <header className="bg-primary p-4 md:p-6 text-primary-foreground flex justify-between items-center shadow-xl shrink-0 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 relative rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-white/10">
                        <Image src={student?.photoURL || `https://placehold.co/200x200.png?text=${student?.fullName?.[0] || student?.displayName?.[0] || 'U'}`} alt="" fill className="object-cover" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none">{student?.fullName || student?.displayName}</h2>
                        <p className="text-xs md:text-sm font-bold text-white/70 uppercase tracking-widest mt-1">DNI: {student?.documentId} • {studentProgramName}</p>
                    </div>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-white/10 hover:bg-white/20 text-white border-2 border-white/20"><LogOut className="h-6 w-6" /></Button>
            </header>

            <main className="flex-1 overflow-hidden p-4 md:p-6 print:overflow-visible print:p-0">
                {step === 'menu' && (
                    <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-8 duration-500 h-full flex flex-col justify-center">
                        <div className="text-center space-y-1"><h3 className="text-3xl font-black uppercase tracking-tighter text-slate-800">¿Qué trámite desea realizar?</h3><p className="text-lg text-slate-500 font-medium">Seleccione una categoría para ver los documentos disponibles.</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map(cat => (
                                <Card key={cat} className="group cursor-pointer hover:border-primary hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] shadow-lg bg-white overflow-hidden" onClick={() => { setSelectedCategory(cat); setStep('category'); }}>
                                    <div className="p-8 flex flex-col items-center text-center space-y-4">
                                        <div className="p-5 bg-slate-50 text-primary rounded-[1.5rem] group-hover:bg-primary group-hover:text-white transition-all duration-500">{cat === 'Solicitud' ? <FileStack className="h-10 w-10" /> : <Stamp className="h-10 w-10" />}</div>
                                        <div><h4 className="text-2xl font-black uppercase tracking-tight leading-none">{cat}S</h4><p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{templates.filter(t => t.category === cat).length} Documentos</p></div>
                                    </div>
                                    <div className="bg-primary h-1.5 w-full scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'category' && (
                    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
                        <Button variant="ghost" onClick={() => setStep('menu')} className="text-lg font-black uppercase h-12 px-6 rounded-xl hover:bg-slate-200 self-start"><ArrowLeft className="mr-3 h-5 w-5" /> VOLVER</Button>
                        <div className="grid gap-4 md:grid-cols-2">
                            {templates.filter(t => t.category === selectedCategory).map(temp => (
                                <Card key={temp.id} className="p-6 rounded-2xl border-none shadow-md hover:shadow-xl transition-all cursor-pointer bg-white flex justify-between items-center group" onClick={() => handleSelectTemplate(temp)}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/5 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors"><FileText className="h-6 w-6" /></div>
                                        <div><h4 className="text-xl font-black uppercase tracking-tight text-slate-800">{temp.name}</h4><Badge variant={temp.requirementType === 'Gratuito' ? 'secondary' : 'outline'} className="mt-1 text-[8px] font-black uppercase tracking-widest">{temp.requirementType === 'Gratuito' ? 'GRATUITO' : `COSTO: ${temp.requirementValue}`}</Badge></div>
                                    </div>
                                    <ChevronRight className="h-8 w-8 text-slate-200 group-hover:text-primary transition-colors" />
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'assistant' && selectedTemplate && (
                    <div className="max-w-full mx-auto space-y-4 animate-in slide-in-from-bottom-8 duration-500 h-full flex flex-col overflow-hidden">
                        <div className="text-center space-y-0.5"><h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Asistente de Documentación</h3><p className="text-xs text-slate-500 font-medium">Complete los pasos para generar su solicitud oficial.</p></div>
                        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden p-6 flex-1 min-h-0 flex flex-col">
                            {selectedTemplate.name.includes('Justificación') ? (
                                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                                    <div className="space-y-2 shrink-0">
                                        <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><div className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] italic font-black">1</div>¿Cuál es el motivo de su falta?</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {['Salud', 'Personal', 'Trabajo', 'Familiar'].map(m => (
                                                <Button key={m} variant={formData['{motivo_justificacion}'] === m ? 'default' : 'outline'} className={cn("h-10 text-xs font-black uppercase rounded-xl border-2 transition-all", formData['{motivo_justificacion}'] === m ? "scale-105 shadow-md" : "opacity-60")} onClick={() => setFormData({...formData, '{motivo_justificacion}': m})}>{m}</Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                                        <div className="lg:col-span-5 flex flex-col space-y-2 min-h-0">
                                            <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><div className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] italic font-black">2</div>Seleccione las fechas</Label>
                                            <div className="bg-slate-50 p-2 rounded-2xl border-2 border-dashed border-slate-200 flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                                                <div className="bg-white p-2 rounded-xl shadow-md border scale-90 md:scale-100 origin-center">
                                                    <Calendar mode="multiple" selected={selectedDates} onSelect={(dates) => { setSelectedDates(dates); if (dates && dates.length > 0) { const formatted = dates.sort((a, b) => a.getTime() - b.getTime()).map(d => format(d, "EEEE dd 'de' MMMM", { locale: es })).join(', '); setFormData(prev => ({...prev, '{fechas_inasistencia}': formatted})); } else { setFormData(prev => ({...prev, '{fechas_inasistencia}': ''})); } }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-7 flex flex-col space-y-4">
                                            <div className="space-y-2 flex-1 flex flex-col min-h-0">
                                                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Días Marcados:</p></div>
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex-1 min-h-[60px] flex items-center justify-center text-center shadow-inner overflow-hidden">{formData['{fechas_inasistencia}'] ? <ScrollArea className="h-full w-full"><p className="text-[11px] font-bold text-primary uppercase leading-tight p-2">{formData['{fechas_inasistencia}']}</p></ScrollArea> : <p className="text-xs text-slate-400 italic">Toque los días en el calendario...</p>}</div>
                                            </div>
                                            <div className="space-y-2 shrink-0">
                                                <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><div className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] italic font-black">3</div>¿Presenta algún certificado físico?</Label>
                                                <div className="flex gap-2">
                                                    {[{v: 'SI', label: 'SÍ, ADJUNTO', icon: CheckCircle2}, {v: 'NO', label: 'NO, DECLARACIÓN', icon: AlertTriangle}].map(opt => (
                                                        <Button key={opt.v} variant={formData['{adjuntos_detalle}'] && formData['{adjuntos_detalle}'].includes(opt.v === 'SI' ? 'POR LO CUAL' : 'SOLICITO') ? 'default' : 'outline'} className={cn("flex-1 h-11 text-[10px] font-black uppercase rounded-xl border-2 gap-2 transition-all", (formData['{adjuntos_detalle}'] && formData['{adjuntos_detalle}'].includes(opt.v === 'SI' ? 'POR LO CUAL' : 'SOLICITO')) ? "bg-primary text-white scale-[1.02]" : "opacity-60")} onClick={() => setFormData({...formData, '{adjuntos_detalle}': opt.v === 'SI' ? 'POR LO CUAL ADJUNTO EL CERTIFICADO CORRESPONDIENTE' : 'SOLICITO SE CONSIDERE MI PALABRA BAJO DECLARACIÓN JURADA'})}><opt.icon className="h-3.5 w-3.5" /> {opt.label}</Button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t flex gap-3"><Button variant="ghost" onClick={() => setStep('category')} className="h-12 flex-1 text-xs font-black uppercase rounded-xl border-2">CANCELAR</Button><Button disabled={!formData['{motivo_justificacion}'] || !formData['{fechas_inasistencia}'] || !formData['{adjuntos_detalle}']} onClick={handleFinalizeAssistant} className="h-12 flex-[2] text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">GENERAR DOCUMENTO <ChevronRight className="ml-2 h-4 w-4" /></Button></div>
                                        </div>
                                    </div>
                                </div>
                            ) : selectedTemplate.name.includes('Constancia') ? (
                                <div className="space-y-8 flex-1 flex flex-col min-h-0 justify-center items-center">
                                    <div className="max-w-md w-full space-y-6">
                                        <div className="space-y-4">
                                            <Label className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center text-xs italic font-black">1</div>
                                                ¿Para qué fines requiere la constancia?
                                            </Label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {['Laborales', 'Académicos', 'Trámites Personales'].map(f => (
                                                    <Button 
                                                        key={f} 
                                                        variant={formData['{fines_tramite}'] === f ? 'default' : 'outline'} 
                                                        className={cn(
                                                            "h-16 text-sm font-black uppercase rounded-2xl border-2 transition-all justify-between px-6",
                                                            formData['{fines_tramite}'] === f ? "scale-[1.02] shadow-xl border-primary" : "opacity-60"
                                                        )}
                                                        onClick={() => setFormData({...formData, '{fines_tramite}': f})}
                                                    >
                                                        {f}
                                                        {formData['{fines_tramite}'] === f && <CheckCircle2 className="h-5 w-5" />}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-200 rounded-3xl flex gap-4 items-center">
                                            <div className="p-2.5 bg-white rounded-xl text-blue-600 shadow-sm"><Info className="h-6 w-6" /></div>
                                            <p className="text-xs font-bold text-blue-800 leading-tight">
                                                Se generará la constancia acreditando su situación académica actual en el programa de <span className="underline">{studentProgramName}</span>.
                                            </p>
                                        </div>

                                        <div className="pt-8 border-t flex gap-4">
                                            <Button variant="ghost" onClick={() => setStep('category')} className="h-14 flex-1 text-sm font-black uppercase rounded-2xl border-2">VOLVER</Button>
                                            <Button 
                                                disabled={!formData['{fines_tramite}']} 
                                                onClick={handleFinalizeAssistant} 
                                                className="h-14 flex-[2] text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20"
                                            >
                                                CONTINUAR <ChevronRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">Modelo en configuración.</div>
                            )}
                        </Card>
                    </div>
                )}

                {step === 'validation' && (
                    <div className="max-w-2xl mx-auto space-y-8 text-center animate-in zoom-in-95 duration-500 h-full flex flex-col justify-center">
                        <div className="h-32 w-32 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg"><CreditCard className="h-16 w-16" /></div>
                        <div className="space-y-4"><h3 className="text-3xl font-black uppercase tracking-tighter text-slate-800">Trámite no autorizado</h3><div className="p-8 bg-white rounded-[2rem] shadow-xl border-2 border-red-200"><p className="text-xl font-bold text-red-700 leading-tight">"{validationError}"</p></div></div>
                        <div className="flex flex-col gap-3"><Button onClick={() => setStep('assistant')} variant="secondary" className="h-14 text-lg font-black rounded-xl">REINTENTAR VALIDACIÓN</Button><Button onClick={handleLogout} variant="ghost" className="h-12 font-bold text-slate-400 uppercase tracking-widest">FINALIZAR SESIÓN</Button></div>
                    </div>
                )}

                {step === 'preview' && selectedTemplate && (
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700 h-full overflow-hidden print:block print:overflow-visible">
                        <div className="lg:col-span-8 overflow-y-auto custom-scrollbar print:overflow-visible print:block print:w-full print:p-0 print-full-page">
                            <Card className="max-w-[210mm] mx-auto min-h-[297mm] border-none p-10 md:p-[20mm] bg-white rounded-none relative overflow-hidden text-black leading-relaxed font-sans shadow-2xl print:shadow-none print:p-[15mm] print:max-w-none">
                                {institute?.logoUrl && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0"><img src={institute.logoUrl} alt="" className="w-[450px] h-[450px] object-contain grayscale" /></div>}
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-8">
                                        <div className="flex items-center gap-3">{institute?.logoUrl && <img src={institute.logoUrl} alt="" className="w-12 h-12 object-contain" />}<div className="text-left leading-tight"><h1 className="text-[11pt] font-black uppercase">{institute?.name}</h1><p className="text-[7pt] text-gray-500 uppercase tracking-widest font-bold">Secretaría Académica • EDA System</p></div></div>
                                        <div className="text-right text-[6pt] font-black text-gray-400 uppercase tracking-widest">EXP-ID: {pointId}-{student?.documentId}</div>
                                    </div>
                                    <div className="text-right mb-12"><p className="text-[10pt] font-black uppercase inline-block border-b-2 border-black pb-0.5">{selectedTemplate.sumilla?.replace(/{motivo_justificacion}/g, (formData['{motivo_justificacion}'] || '').toUpperCase())}</p></div>
                                    <div className="mt-12 mb-8 space-y-1"><p className="font-black text-[10pt] uppercase leading-none">SEÑOR {selectedTemplate.addresseeType === 'Director' ? 'DIRECTOR GENERAL' : 'COORDINADOR DEL PROGRAMA DE ESTUDIOS'}:</p><p className="font-bold text-[10pt] uppercase underline decoration-2 underline-offset-4">{selectedTemplate.addresseeType === 'Director' ? selectedTemplate.directorName : coordinatorName}</p><p className="font-bold text-[10pt] uppercase">{institute?.name}</p></div>
                                    <div className="text-justify text-[10pt] leading-loose mb-6">Yo, <span className="font-black underline">{student?.fullName || student?.displayName}</span>, identificado con DNI N° <span className="font-mono font-bold">{student?.documentId}</span>, {student.isStaff ? 'miembro del personal' : 'estudiante'} del programa de estudios de <span className="font-bold">{studentProgramName}</span>, {student.isStaff ? '' : `perteneciente al ${student?.currentSemester || 1}° Semestre, `}turno <span className="font-bold">{student?.turno || 'N/A'}</span>, con domicilio en <span className="font-bold">{student?.address || '---'}</span>, ante usted con el debido respeto me presento y expongo:</div>
                                    <div className="text-justify leading-loose text-[10pt] min-h-[100px] whitespace-pre-wrap font-medium"><div dangerouslySetInnerHTML={{ __html: getFormattedContent(selectedTemplate.content) }} /></div>
                                    <div className="mt-4 mb-4 font-bold uppercase text-[10pt] leading-relaxed">POR LO TANTO:<br/>Espero acceda a mi solicitud por ser de justicia.</div>
                                    <div className={cn("mt-32 mb-8", formData['{adjuntos_detalle}']?.includes('ADJUNTO EL CERTIFICADO') ? "font-bold uppercase text-[9pt]" : "")}>{formData['{adjuntos_detalle}']?.includes('ADJUNTO EL CERTIFICADO') ? "ADJUNTO: DOCUMENTOS." : ""}</div>
                                    <div className="text-right mt-8 italic text-[9pt] text-gray-700">Dado en la sede institucional, a los {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}.</div>
                                    <div className="mt-20 pt-2 border-t border-black w-72 mx-auto text-center"><p className="font-black uppercase text-[9pt] tracking-tight">{student?.fullName || student?.displayName}</p><p className="text-[7pt] font-black text-gray-500 uppercase tracking-widest leading-none">DNI: {student?.documentId}</p><p className="text-[6.5pt] font-bold text-gray-400 uppercase tracking-tighter mt-1">{studentProgramName}</p></div>
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-4 flex flex-col gap-4 print:hidden">
                            <Card className={cn("rounded-2xl border-2 p-4 animate-in fade-in zoom-in-95 duration-500", getPrinterStatusColor())}>
                                <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Printer className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Estado Impresora</span></div>{point?.tonerLevel !== undefined && <span className="text-[9px] font-bold">Tóner: {point.tonerLevel}%</span>}</div>
                                <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase">{!point?.printerStatus || point.printerStatus === 'Offline' ? 'Desconectada' : point.paperStatus === 'Empty' ? 'Sin Papel' : 'Lista'}</p><Activity className={cn("h-4 w-4", point?.printerStatus === 'Printing' && "animate-spin")} /></div>
                            </Card>
                            <Card className="rounded-[2rem] border-none shadow-xl bg-primary text-primary-foreground p-6 space-y-4">
                                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center"><Printer className="h-6 w-6 text-white" /></div>
                                <div><h4 className="text-xl font-black uppercase tracking-tight">Confirmar e Imprimir</h4><p className="text-xs text-white/70 font-medium mt-1">Revise su información. Al confirmar se generará un cargo oficial.</p></div>
                                <Button className="w-full h-16 text-xl font-black uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/80 shadow-xl rounded-xl" onClick={() => { if (!point?.printerStatus || point.printerStatus === 'Offline') { toast({ title: "Error", description: "Impresora desconectada.", variant: "destructive" }); return; } registerGenerationLog(effectiveInstituteId, { studentId: student!.documentId, studentName: student!.fullName || student!.displayName, templateId: selectedTemplate!.id, templateName: selectedTemplate!.name, printPointId: pointId, status: 'Exitoso', instituteId: effectiveInstituteId }); window.print(); handleLogout(); }} disabled={!point?.printerStatus || point.printerStatus === 'Offline'}>{(!point?.printerStatus || point.printerStatus === 'Offline') ? 'IMPRESORA OFF' : 'IMPRIMIR'}</Button>
                            </Card>
                            <Button variant="ghost" onClick={() => setStep('assistant')} className="h-12 font-black uppercase rounded-xl border-2 border-slate-200"><ArrowLeft className="mr-2 h-4 w-4" /> CORREGIR</Button>
                        </div>
                    </div>
                )}
            </main>
            <footer className="p-2 text-center bg-white border-t text-[8px] font-black uppercase tracking-[0.3em] text-slate-300 shrink-0 print:hidden">STEM V2 • POINT PRINT SYSTEM • {new Date().getFullYear()}</footer>
        </div>
    );
}
