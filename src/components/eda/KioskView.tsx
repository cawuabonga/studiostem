
'use client';

/**
 * @fileOverview Componente Maestro del Kiosko EDA (Point Print).
 * Interfaz táctil de alta fidelidad optimizada para trámites físicos.
 * Sincronizado dinámicamente con el color primario del instituto.
 * Soporta imágenes de fondo personalizadas por cada terminal.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { listenToPrintPoint, closeKioskSession, getDocumentTemplates } from '@/services/eda-service';
import { getStudentProfile, getInstitute, getStaffProfiles, getPaymentConcepts, getStudentPaymentsByStatus } from '@/config/firebase';
import type { PrintPoint, StudentProfile, DocumentTemplate, Institute, StaffProfile, PaymentConcept, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    HeartPulse,
    Search,
    Stamp,
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface KioskViewProps {
    pointId: string;
    instituteId: string;
}

type KioskStep = 'idle' | 'menu' | 'category' | 'assistant' | 'validation' | 'preview';

export function KioskView({ pointId, instituteId }: KioskViewProps) {
    const [point, setPoint] = useState<PrintPoint | null>(null);
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [institute, setInstitute] = useState<Institute | null>(null);
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [staff, setStaff] = useState<StaffProfile[]>([]);
    
    // UI state
    const [step, setStep] = useState<KioskStep>('idle');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    // Form flow state
    const [formData, setFormData] = useState<Record<string, string>>({});
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
            getStaffProfiles(instituteId)
        ]).then(([inst, temps, staffList]) => {
            setInstitute(inst);
            setTemplates(temps);
            setStaff(staffList);
            setLoading(false);
        });
    }, [instituteId]);

    const loadStudentSession = async (sId: string) => {
        setLoading(true);
        const profile = await getStudentProfile(instituteId, sId);
        setStudent(profile);
        setStep('menu');
        setLoading(false);
    };

    const handleLogout = async () => {
        await closeKioskSession(instituteId, pointId);
    };

    const categories = useMemo(() => {
        const cats = new Set(templates.map(t => t.category));
        return Array.from(cats);
    }, [templates]);

    const handleSelectTemplate = (template: DocumentTemplate) => {
        setSelectedTemplate(template);
        setFormData({});
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
                {/* FONDO PERSONALIZADO - Se elimina el patrón aleatorio del puente */}
                {point?.backgroundImageUrl ? (
                    <Image 
                        src={point.backgroundImageUrl} 
                        alt="Background" 
                        fill 
                        className="object-cover opacity-60"
                        priority
                    />
                ) : (
                    // Si no hay imagen, usamos un gradiente limpio basado en el color primario
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40" />
                )}

                {/* Capa de gradiente superior para asegurar legibilidad */}
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

                    <div className="bg-white/95 backdrop-blur-2xl p-10 rounded-[3.5rem] shadow-3xl border-2 border-white/50 space-y-6 animate-pulse">
                        <div className="h-20 w-20 mx-auto bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
                            <Fingerprint className="h-10 w-10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tight text-primary">Identifíquese</h2>
                            <p className="text-xl font-medium text-slate-500">Pase su carnet RFID por el lector para iniciar.</p>
                        </div>
                    </div>

                    <div className="pt-12">
                        <Badge variant="outline" className="bg-black/40 h-10 px-6 rounded-full border-white/10 text-white font-bold uppercase tracking-widest text-xs backdrop-blur-md">
                            Terminal: {point?.name || 'Local'} • {pointId}
                        </Badge>
                    </div>
                </div>
            </div>
        );
    }

    // CABECERA DEL KIOSKO (USUARIO IDENTIFICADO)
    const KioskHeader = () => (
        <header className="bg-primary p-6 md:p-8 text-primary-foreground flex justify-between items-center shadow-2xl shrink-0">
            <div className="flex items-center gap-6">
                <div className="h-20 w-20 relative rounded-2xl overflow-hidden border-4 border-white/20 shadow-xl bg-white/10">
                    <Image src={student?.photoURL || `https://placehold.co/200x200.png?text=${student?.fullName[0]}`} alt="" fill className="object-cover" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">{student?.fullName}</h2>
                    <p className="text-sm md:text-lg font-bold text-white/70 uppercase tracking-widest mt-1">
                        DNI: {student?.documentId} • {student?.programId}
                    </p>
                </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="h-16 w-16 md:h-20 md:w-20 rounded-[2rem] bg-white/10 hover:bg-white/20 text-white border-2 border-white/20">
                <LogOut className="h-8 w-8" />
            </Button>
        </header>
    );

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
            <KioskHeader />

            <main className="flex-1 overflow-y-auto p-6 md:p-12">
                
                {/* VISTA: MENÚ PRINCIPAL */}
                {step === 'menu' && (
                    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="text-center space-y-2">
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-800">¿Qué trámite desea realizar?</h3>
                            <p className="text-xl text-slate-500 font-medium">Seleccione una categoría para ver los documentos disponibles.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {categories.map(cat => (
                                <Card 
                                    key={cat} 
                                    className="group cursor-pointer hover:border-primary hover:shadow-3xl transition-all duration-500 rounded-[3rem] border-none shadow-xl bg-white overflow-hidden"
                                    onClick={() => { setSelectedCategory(cat); setStep('category'); }}
                                >
                                    <div className="p-10 flex flex-col items-center text-center space-y-6">
                                        <div className="p-6 bg-slate-50 text-primary rounded-[2rem] group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                            {cat === 'Solicitud' ? <FileStack className="h-14 w-14" /> : <Stamp className="h-14 w-14" />}
                                        </div>
                                        <div>
                                            <h4 className="text-3xl font-black uppercase tracking-tight leading-none">{cat}S</h4>
                                            <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                                {templates.filter(t => t.category === cat).length} Documentos Disponibles
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-primary h-2 w-full scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* VISTA: LISTA DE MODELOS POR CATEGORÍA */}
                {step === 'category' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                        <Button variant="ghost" onClick={() => setStep('menu')} className="text-xl font-black uppercase h-14 px-8 rounded-2xl hover:bg-slate-200">
                            <ArrowLeft className="mr-3 h-6 w-6" /> VOLVER AL MENÚ
                        </Button>

                        <div className="grid gap-6 md:grid-cols-2">
                            {templates.filter(t => t.category === selectedCategory).map(temp => (
                                <Card 
                                    key={temp.id} 
                                    className="p-8 rounded-[2.5rem] border-none shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer bg-white flex justify-between items-center group"
                                    onClick={() => handleSelectTemplate(temp)}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-primary/5 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                                            <FileText className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black uppercase tracking-tight text-slate-800">{temp.name}</h4>
                                            <Badge variant={temp.requirementType === 'Gratuito' ? 'secondary' : 'outline'} className="mt-2 text-[10px] font-black uppercase tracking-widest border-primary/20">
                                                {temp.requirementType === 'Gratuito' ? 'GRATUITO' : `COSTO: ${temp.requirementValue}`}
                                            </Badge>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-10 w-10 text-slate-200 group-hover:text-primary transition-colors" />
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* VISTA: ASISTENTE DE TRÁMITE (PASO A PASO) */}
                {step === 'assistant' && selectedTemplate && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                         <div className="text-center space-y-2">
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-800">Complete su información</h3>
                            <p className="text-xl text-slate-500 font-medium">Esta información se inyectará formalmente en su documento.</p>
                        </div>

                        <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden p-10 space-y-10">
                            {/* MODELO ESPECÍFICO: JUSTIFICACIÓN */}
                            {selectedTemplate.name.includes('Justificación') ? (
                                <div className="space-y-10">
                                    {/* PASO 1: MOTIVO */}
                                    <div className="space-y-4">
                                        <Label className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
                                            <div className="h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center text-sm italic">1</div>
                                            ¿Cuál es el motivo de su falta?
                                        </Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {['Salud', 'Personal', 'Trabajo', 'Familiar'].map(m => (
                                                <Button 
                                                    key={m} 
                                                    variant={formData['{motivo_justificacion}'] === m ? 'default' : 'outline'}
                                                    className={cn(
                                                        "h-20 text-lg font-black uppercase rounded-2xl border-2 transition-all",
                                                        formData['{motivo_justificacion}'] === m ? "scale-105 shadow-xl" : "opacity-70"
                                                    )}
                                                    onClick={() => setFormData({...formData, '{motivo_justificacion}': m})}
                                                >
                                                    {m}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* PASO 2: FECHAS */}
                                    <div className="space-y-4">
                                        <Label className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
                                            <div className="h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center text-sm italic">2</div>
                                            Indique las fechas de inasistencia
                                        </Label>
                                        <Input 
                                            placeholder="Ej: Lunes 12 y Martes 13 de Mayo" 
                                            value={formData['{fechas_inasistencia}'] || ''}
                                            onChange={e => setFormData({...formData, '{fechas_inasistencia}': e.target.value})}
                                            className="h-16 text-xl font-bold rounded-2xl border-2 border-slate-200 focus-visible:ring-primary/20"
                                        />
                                    </div>

                                    {/* PASO 3: ADJUNTOS */}
                                    <div className="space-y-4">
                                        <Label className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
                                            <div className="h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center text-sm italic">3</div>
                                            ¿Adjunta algún certificado físico?
                                        </Label>
                                        <div className="flex gap-4">
                                            {[
                                                {v: 'SI', label: 'SÍ, ADJUNTO DOCUMENTO', icon: CheckCircle2},
                                                {v: 'NO', label: 'NO, SOLO DECLARACIÓN', icon: AlertTriangle}
                                            ].map(opt => (
                                                <Button 
                                                    key={opt.v} 
                                                    variant={formData['{adjuntos_detalle}'] === opt.v ? 'default' : 'outline'}
                                                    className={cn(
                                                        "flex-1 h-20 text-sm font-black uppercase rounded-2xl border-2 gap-3 transition-all",
                                                        formData['{adjuntos_detalle}'] === opt.v ? "scale-105 shadow-xl" : "opacity-70"
                                                    )}
                                                    onClick={() => setFormData({...formData, '{adjuntos_detalle}': opt.v === 'SI' ? 'POR LO CUAL ADJUNTO EL CERTIFICADO CORRESPONDIENTE' : 'SOLICITO SE CONSIDERE MI PALABRA BAJO DECLARACIÓN JURADA'})}
                                                >
                                                    <opt.icon className="h-6 w-6" /> {opt.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center text-slate-400">Este modelo requiere configuración de campos dinámicos en el panel de administrador.</div>
                            )}

                            <div className="flex gap-4 pt-6">
                                <Button variant="ghost" onClick={() => setStep('category')} className="h-20 flex-1 text-xl font-black rounded-3xl">CANCELAR</Button>
                                <Button 
                                    disabled={Object.keys(formData).length < 3}
                                    onClick={handleFinalizeAssistant}
                                    className="h-20 flex-[2] text-2xl font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-primary/30"
                                >
                                    Siguiente Paso <ChevronRight className="ml-3 h-8 w-8" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* VISTA: VALIDACIÓN DE REQUISITOS (PAGO) */}
                {step === 'validation' && (
                    <div className="max-w-2xl mx-auto space-y-12 text-center animate-in zoom-in-95 duration-500">
                        <div className="h-40 w-40 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                            <CreditCard className="h-20 w-20" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-800">Trámite no autorizado</h3>
                            <div className="p-10 bg-white rounded-[3rem] shadow-xl border-2 border-red-200">
                                <p className="text-2xl font-bold text-red-700 leading-tight">"{validationError}"</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                             <Button onClick={() => setStep('assistant')} variant="secondary" className="h-20 text-xl font-black rounded-3xl">REINTENTAR VALIDACIÓN</Button>
                             <Button onClick={handleLogout} variant="ghost" className="h-16 font-bold text-slate-400 uppercase tracking-widest">FINALIZAR SESIÓN</Button>
                        </div>
                    </div>
                )}

                {/* VISTA: PREVISUALIZACIÓN Y FIRMA FINAL */}
                {step === 'preview' && selectedTemplate && (
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-700">
                        <div className="lg:col-span-8">
                            <Card className="max-w-[210mm] mx-auto min-h-[297mm] shadow-3xl border-none p-[25mm] bg-white rounded-none relative overflow-hidden text-black leading-relaxed font-sans shadow-2xl shadow-slate-400/50">
                                {/* Encabezado */}
                                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-10">
                                    <div className="flex items-center gap-4">
                                        {institute?.logoUrl && <img src={institute.logoUrl} alt="" className="w-[65px] h-[65px] object-contain" />}
                                        <div className="text-left leading-tight">
                                            <h1 className="text-[13pt] font-black uppercase">{institute?.name}</h1>
                                            <p className="text-[8pt] text-gray-500 uppercase tracking-widest font-bold">Secretaría Académica • EDA System</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-[7pt] font-black text-gray-400 uppercase tracking-widest">EXP-ID: {pointId}-{student?.documentId}</div>
                                </div>

                                {/* Sumilla */}
                                <div className="text-right mb-12">
                                    <p className="text-[11pt] font-black uppercase inline-block border-b-2 border-black pb-0.5">
                                        {selectedTemplate.sumilla?.replace(/{motivo_justificacion}/g, formData['{motivo_justificacion}'].toUpperCase())}
                                    </p>
                                </div>

                                {/* Destinatario */}
                                <div className="mb-10 space-y-1">
                                    <p className="font-black text-[11pt] uppercase leading-none">SEÑOR {selectedTemplate.addresseeType === 'Director' ? 'DIRECTOR GENERAL' : 'COORDINADOR DEL PROGRAMA DE ESTUDIOS'}:</p>
                                    <p className="font-bold text-[11pt] uppercase underline decoration-2 underline-offset-4">
                                        {selectedTemplate.addresseeType === 'Director' ? selectedTemplate.directorName : (staff.find(s => s.programId === student?.programId && (s.role === 'Coordinator' || s.roleId === 'coordinator'))?.displayName || 'COORDINADOR ACADÉMICO')}
                                    </p>
                                    <p className="font-bold text-[11pt] uppercase">{institute?.name}</p>
                                </div>

                                {/* Identidad */}
                                <div className="text-justify text-[11pt] leading-loose mb-8">
                                    Yo, <span className="font-black underline">{student?.fullName}</span>, 
                                    identificado con DNI N° <span className="font-mono font-bold">{student?.documentId}</span>, 
                                    estudiante del programa de estudios de <span className="font-bold">{student?.programId}</span>, 
                                    perteneciente al <span className="font-bold">{student?.currentSemester || 1}° Semestre</span>, 
                                    turno <span className="font-bold">{student?.turno}</span>, 
                                    con domicilio en <span className="font-bold">{student?.address || '---'}</span>, 
                                    ante usted con el debido respeto me presento y expongo:
                                </div>

                                {/* Argumentación Dinámica Inyectada */}
                                <div className="text-justify leading-relaxed text-[11pt] min-h-[300px] whitespace-pre-wrap font-medium py-4 border-l-2 border-slate-100 pl-6 bg-slate-50/30">
                                    {selectedTemplate.content
                                        .replace(/{motivo_justificacion}/g, formData['{motivo_justificacion}'].toUpperCase())
                                        .replace(/{fechas_inasistencia}/g, formData['{fechas_inasistencia}'].toUpperCase())
                                        .replace(/{adjuntos_detalle}/g, formData['{adjuntos_detalle}'])
                                    }
                                </div>

                                <div className="my-10 font-bold uppercase text-[11pt]">
                                    Por lo tanto:<br/>
                                    Espero acceda a mi solicitud por ser de justicia.
                                </div>

                                <div className="text-right mt-12 italic text-[10pt] text-gray-700">
                                    Dado en la sede institucional, a los {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}.
                                </div>

                                <div className="mt-24 pt-2 border-t border-black w-72 mx-auto text-center">
                                    <p className="font-black uppercase text-[10pt] tracking-tight">{student?.fullName}</p>
                                    <span className="text-[8pt] font-black text-gray-500 uppercase tracking-widest">DNI: {student?.documentId}</span>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <Card className="rounded-[2.5rem] border-none shadow-xl bg-primary text-primary-foreground p-8 space-y-6">
                                <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Printer className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black uppercase tracking-tight">Confirmar Trámite</h4>
                                    <p className="text-sm text-white/70 font-medium mt-2">Revise que su información sea correcta antes de imprimir. Se generará un cargo digital.</p>
                                </div>
                                <Button 
                                    className="w-full h-24 text-2xl font-black uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/80 shadow-2xl rounded-[1.5rem] animate-pulse"
                                    onClick={() => {
                                        window.print();
                                        handleLogout();
                                        toast({ title: "Documento Enviado", description: "Iniciando proceso de impresión." });
                                    }}
                                >
                                    IMPRIMIR AHORA
                                </Button>
                            </Card>

                            <Button variant="ghost" onClick={() => setStep('assistant')} className="h-16 font-black uppercase rounded-2xl border-2 border-slate-200">
                                <ArrowLeft className="mr-3 h-5 w-5" /> CORREGIR DATOS
                            </Button>

                            <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex gap-4 items-start">
                                <Info className="h-6 w-6 text-blue-600 shrink-0" />
                                <p className="text-xs text-blue-800 leading-tight font-medium">
                                    Al imprimir este documento, se guardará una copia digital en su expediente para que su Coordinador pueda revisarla y firmarla posteriormente.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            
            {/* PIE DE PÁGINA FIXO KIOSKO */}
            <footer className="p-4 text-center bg-white border-t text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                STEM V2 • POINT PRINT SYSTEM • {new Date().getFullYear()}
            </footer>
        </div>
    );
}
