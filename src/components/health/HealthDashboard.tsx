
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProfile, getStaffProfileByDocumentId } from '@/config/firebase';
import { getRecentConsultations, getPatientConsultationHistory, updateMedicalInfo, registerConsultation } from '@/services/health-service';
import type { StudentProfile, StaffProfile, MedicalInfo, MedicalConsultation, BloodType, InsuranceType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
    Search, 
    Stethoscope, 
    History, 
    PlusCircle, 
    User, 
    Activity, 
    HeartPulse, 
    AlertCircle, 
    PhoneCall, 
    Loader2, 
    Save, 
    ClipboardPlus,
    CalendarCheck,
    Thermometer,
    Scale,
    Droplet
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const bloodTypes: BloodType[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const insuranceTypes: InsuranceType[] = ['SIS', 'EsSalud', 'Privado', 'Ninguno'];

export function HealthDashboard() {
    const { instituteId, user } = useAuth();
    const { toast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<{ profile: any, type: 'student' | 'staff' } | null>(null);
    const [patientHistory, setPatientHistory] = useState<MedicalConsultation[]>([]);
    const [recentGlobal, setRecentGlobal] = useState<MedicalConsultation[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isConsultOpen, setIsConsultOpen] = useState(false);
    const [isEditInfoOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [medicalFormData, setMedicalData] = useState<MedicalInfo>({
        bloodType: undefined,
        allergies: [],
        chronicDiseases: '',
        permanentMedications: '',
        insuranceType: undefined,
        emergencyContactName: '',
        emergencyContactPhone: ''
    });

    const [consultData, setConsultData] = useState({
        reason: '',
        diagnosis: '',
        treatment: '',
        medicationsDelivered: '',
        triage: { weight: 0, height: 0, temperature: 0, bloodPressure: '', heartRate: 0 }
    });

    const fetchGlobalData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const recent = await getRecentConsultations(instituteId);
            setRecentGlobal(recent);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [instituteId]);

    useEffect(() => { fetchGlobalData(); }, [fetchGlobalData]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchTerm || !instituteId) return;
        setSearching(true);
        try {
            const student = await getStudentProfile(instituteId, searchTerm);
            if (student) {
                setSelectedPatient({ profile: student, type: 'student' });
                setMedicalData(student.medicalInfo || { allergies: [] });
                const history = await getPatientConsultationHistory(instituteId, student.documentId);
                setPatientHistory(history);
                return;
            }

            const staff = await getStaffProfileByDocumentId(instituteId, searchTerm);
            if (staff) {
                setSelectedPatient({ profile: staff, type: 'staff' });
                setMedicalData(staff.medicalInfo || { allergies: [] });
                const history = await getPatientConsultationHistory(instituteId, staff.documentId);
                setPatientHistory(history);
                return;
            }

            toast({ title: "No encontrado", description: "No existe perfil con ese DNI.", variant: "destructive" });
        } catch (error) {
            toast({ title: "Error en búsqueda", variant: "destructive" });
        } finally {
            setSearching(false);
        }
    };

    const handleSaveMedicalInfo = async () => {
        if (!instituteId || !selectedPatient) return;
        setIsSubmitting(true);
        try {
            await updateMedicalInfo(instituteId, selectedPatient.profile.documentId, selectedPatient.type, medicalFormData);
            toast({ title: "Ficha Actualizada", description: "Los datos base de salud han sido guardados." });
            setIsEditOpen(false);
            handleSearch(); // Refresh
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally { setIsSubmitting(false); }
    };

    const handleRegisterConsult = async () => {
        if (!instituteId || !selectedPatient || !user) return;
        setIsSubmitting(true);
        try {
            await registerConsultation(instituteId, {
                patientId: selectedPatient.profile.documentId,
                patientName: selectedPatient.profile.fullName || selectedPatient.profile.displayName,
                patientRole: selectedPatient.profile.role,
                reason: consultData.reason,
                triage: consultData.triage,
                diagnosis: consultData.diagnosis,
                treatment: consultData.treatment,
                medicationsDelivered: consultData.medicationsDelivered,
                responsibleId: user.uid,
                responsibleName: user.displayName || 'Médico de Turno'
            });
            toast({ title: "Consulta Registrada", description: "Se ha añadido al historial médico." });
            setIsConsultOpen(false);
            setConsultData({ reason: '', diagnosis: '', treatment: '', medicationsDelivered: '', triage: { weight: 0, height: 0, temperature: 0, bloodPressure: '', heartRate: 0 } });
            handleSearch(); // Refresh history
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            
            {/* Buscador de Paciente */}
            <Card className="border-primary/20 shadow-xl rounded-3xl overflow-hidden bg-primary text-primary-foreground">
                <CardHeader className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <Stethoscope className="h-8 w-8 text-accent" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black tracking-tighter uppercase">Gestión de Tópico</CardTitle>
                                <CardDescription className="text-primary-foreground/80 text-lg font-medium">Búsqueda rápida de pacientes por DNI para atención inmediata.</CardDescription>
                            </div>
                        </div>
                        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                            <Input 
                                placeholder="DNI del paciente..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-12 w-full md:w-64 bg-white text-black font-mono font-bold text-lg rounded-xl"
                            />
                            <Button type="submit" variant="secondary" className="h-12 font-black px-6" disabled={searching}>
                                {searching ? <Loader2 className="animate-spin" /> : <Search className="h-5 w-5" />}
                            </Button>
                        </form>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Columna Izquierda: Ficha y Acciones */}
                <div className="lg:col-span-8 space-y-6">
                    {selectedPatient ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            
                            {/* Card Perfil Paciente */}
                            <Card className="rounded-3xl shadow-lg border-none overflow-hidden group">
                                <div className="p-8 flex flex-col md:flex-row gap-8 bg-white transition-all group-hover:bg-slate-50/50">
                                    <div className="flex flex-col items-center gap-4 shrink-0">
                                        <div className="h-32 w-32 relative rounded-3xl overflow-hidden border-4 border-muted shadow-xl">
                                            <Image 
                                                src={selectedPatient.profile.photoURL || `https://placehold.co/200x200.png?text=${selectedPatient.profile.fullName[0]}`} 
                                                alt="Paciente" fill className="object-cover" 
                                            />
                                        </div>
                                        <Badge className="font-black px-4">{selectedPatient.profile.role}</Badge>
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-800 leading-tight">
                                                {selectedPatient.profile.fullName || selectedPatient.profile.displayName}
                                            </h2>
                                            <p className="text-sm font-bold text-primary flex items-center gap-1.5 mt-1 uppercase">
                                                <Activity className="h-4 w-4" /> DNI: {selectedPatient.profile.documentId} • Carrera: {selectedPatient.profile.programId}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="p-3 rounded-2xl bg-red-50 border border-red-100 flex flex-col items-center justify-center">
                                                <Droplet className="h-4 w-4 text-red-500 mb-1" />
                                                <p className="text-[8px] font-black uppercase text-red-400">Grupo Sanguíneo</p>
                                                <p className="text-lg font-black text-red-700">{medicalFormData.bloodType || '---'}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center">
                                                <AlertCircle className="h-4 w-4 text-amber-500 mb-1" />
                                                <p className="text-[8px] font-black uppercase text-amber-400">Alergias</p>
                                                <p className="text-[10px] font-bold text-amber-700 text-center leading-tight">
                                                    {medicalFormData.allergies.length > 0 ? medicalFormData.allergies.join(', ') : 'Ninguna'}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center">
                                                <ShieldCheck className="h-4 w-4 text-blue-500 mb-1" />
                                                <p className="text-[8px] font-black uppercase text-blue-400">Seguro</p>
                                                <p className="text-xs font-black text-blue-700 uppercase">{medicalFormData.insuranceType || 'S/D'}</p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
                                                <PhoneCall className="h-4 w-4 text-slate-500 mb-1" />
                                                <p className="text-[8px] font-black uppercase text-slate-400">Emergencia</p>
                                                <p className="text-[10px] font-bold text-slate-700 text-center leading-tight">{medicalFormData.emergencyContactPhone || '---'}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button className="font-black h-12 flex-1 rounded-xl shadow-lg" onClick={() => setIsConsultOpen(true)}>
                                                <ClipboardPlus className="mr-2 h-5 w-5" /> REGISTRAR ATENCIÓN
                                            </Button>
                                            <Button variant="outline" className="font-bold h-12 px-6 rounded-xl" onClick={() => setIsEditOpen(true)}>
                                                <Save className="mr-2 h-4 w-4" /> FICHA BASE
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Historial Médico del Paciente */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <History className="h-5 w-5" /> Historial Clínico Digital ({patientHistory.length})
                                </h4>
                                {patientHistory.length > 0 ? patientHistory.map(consult => (
                                    <Card key={consult.id} className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
                                        <CardHeader className="bg-muted/30 py-3 border-b">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                                    <CalendarCheck className="h-3.5 w-3.5" /> {format(consult.date.toDate(), "dd MMMM yyyy, HH:mm", { locale: es })}
                                                </p>
                                                <Badge variant="outline" className="text-[8px] font-black">{consult.responsibleName}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-5 grid md:grid-cols-12 gap-6">
                                            <div className="md:col-span-3 space-y-3">
                                                <div className="bg-slate-50 p-3 rounded-xl border border-dashed flex flex-wrap gap-2 justify-center">
                                                    <div className="text-center px-2"><p className="text-[7px] font-black text-muted-foreground">T°</p><p className="text-xs font-black">{consult.triage.temperature}°C</p></div>
                                                    <div className="text-center px-2"><p className="text-[7px] font-black text-muted-foreground">P.A.</p><p className="text-xs font-black">{consult.triage.bloodPressure}</p></div>
                                                    <div className="text-center px-2"><p className="text-[7px] font-black text-muted-foreground">P.</p><p className="text-xs font-black">{consult.triage.weight}kg</p></div>
                                                </div>
                                            </div>
                                            <div className="md:col-span-9 space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black uppercase text-primary">Motivo de Consulta:</p>
                                                    <p className="text-sm font-bold text-slate-800 leading-tight">"{consult.reason}"</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground">Diagnóstico Presuntivo:</p>
                                                        <p className="text-xs font-medium italic">{consult.diagnosis}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground">Tratamiento / Insumos:</p>
                                                        <p className="text-xs font-medium">{consult.treatment}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
                                        <ClipboardPlus className="h-10 w-10 mx-auto mb-3 opacity-10" />
                                        <p className="font-bold uppercase text-[10px]">Sin atenciones registradas en el sistema</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="h-[500px] flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/5 border-2 border-dashed rounded-[3rem]">
                            <User className="h-16 w-16 mb-4 opacity-10" />
                            <p className="text-xl font-black uppercase tracking-widest">Identifique un paciente</p>
                            <p className="text-sm mt-2 max-w-xs">Ingrese el DNI del alumno o personal para cargar su ficha médica oficial.</p>
                        </div>
                    )}
                </div>

                {/* Columna Derecha: Monitor en Vivo */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-3xl shadow-xl border-none h-fit">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <HeartPulse className="h-4 w-4 animate-pulse text-red-500" /> Atenciones Recientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[600px]">
                                <div className="p-4 space-y-3">
                                    {recentGlobal.length > 0 ? recentGlobal.map(consult => (
                                        <div key={consult.id} className="p-4 bg-card rounded-2xl border hover:border-primary/20 transition-all shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="text-[7px] font-black uppercase">{consult.patientRole}</Badge>
                                                <span className="text-[8px] font-bold text-muted-foreground">{formatDistanceToNow(consult.date.toDate(), { addSuffix: true, locale: es })}</span>
                                            </div>
                                            <h5 className="text-xs font-black uppercase truncate">{consult.patientName}</h5>
                                            <p className="text-[10px] text-primary font-bold mt-1 line-clamp-1">"{consult.reason}"</p>
                                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-dashed">
                                                <span className="text-[8px] font-bold text-muted-foreground uppercase">{consult.responsibleName}</span>
                                                <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase" onClick={() => { 
                                                    setSearchTerm(consult.patientId); 
                                                    handleSearch(); 
                                                }}>VER FICHA</Button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                            <History className="h-10 w-10 mb-2" />
                                            <p className="text-[10px] font-black uppercase">Sin actividad hoy</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialog: Registro de Atención (Triaje y Tratamiento) */}
            <Dialog open={isConsultOpen} onOpenChange={setIsConsultOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                                <ClipboardPlus className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Registro de Tópico</DialogTitle>
                                <DialogDescription className="text-primary-foreground/80 font-medium">Evaluación clínica y tratamiento inmediato.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-muted/20 p-6 rounded-2xl border-2 border-dashed">
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase flex items-center gap-1"><Scale className="h-3 w-3" /> Peso (kg)</Label>
                                <Input type="number" step="0.1" value={consultData.triage.weight} onChange={e => setConsultData({...consultData, triage: {...consultData.triage, weight: parseFloat(e.target.value)}})} className="h-9 font-bold" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase flex items-center gap-1">Talla (cm)</Label>
                                <Input type="number" value={consultData.triage.height} onChange={e => setConsultData({...consultData, triage: {...consultData.triage, height: parseInt(e.target.value)}})} className="h-9 font-bold" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temp (°C)</Label>
                                <Input type="number" step="0.1" value={consultData.triage.temperature} onChange={e => setConsultData({...consultData, triage: {...consultData.triage, temperature: parseFloat(e.target.value)}})} className="h-9 font-bold" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase flex items-center gap-1">P.A.</Label>
                                <Input placeholder="120/80" value={consultData.triage.bloodPressure} onChange={e => setConsultData({...consultData, triage: {...consultData.triage, bloodPressure: e.target.value}})} className="h-9 font-bold" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase flex items-center gap-1">Pulso (bpm)</Label>
                                <Input type="number" value={consultData.triage.heartRate} onChange={e => setConsultData({...consultData, triage: {...consultData.triage, heartRate: parseInt(e.target.value)}})} className="h-9 font-bold" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Motivo de la Atención</Label>
                                <Input value={consultData.reason} onChange={e => setConsultData({...consultData, reason: e.target.value})} placeholder="Ej: Dolor abdominal intenso, caída en taller..." className="h-11" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Diagnóstico Presuntivo</Label>
                                    <Textarea rows={3} value={consultData.diagnosis} onChange={e => setConsultData({...consultData, diagnosis: e.target.value})} className="resize-none text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Tratamiento / Insumos Entregados</Label>
                                    <Textarea rows={3} value={consultData.treatment} onChange={e => setConsultData({...consultData, treatment: e.target.value})} className="resize-none text-sm" placeholder="Ej: 01 Tableta Paracetamol 500mg..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-muted/50 border-t">
                        <Button variant="ghost" onClick={() => setIsConsultOpen(false)} className="font-bold">CANCELAR</Button>
                        <Button onClick={handleRegisterConsult} disabled={isSubmitting || !consultData.reason} className="font-black px-12 shadow-xl shadow-primary/20">
                            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            FINALIZAR REGISTRO
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Ficha Médica Base */}
            <Dialog open={isEditInfoOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md rounded-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase text-primary">Actualizar Ficha Médica</DialogTitle>
                        <DialogDescription>Datos permanentes de salud del paciente.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Grupo Sanguíneo</Label>
                                <Select value={medicalFormData.bloodType} onValueChange={v => setMedicalData({...medicalFormData, bloodType: v as BloodType})}>
                                    <SelectTrigger><SelectValue placeholder="Elegir..." /></SelectTrigger>
                                    <SelectContent>{bloodTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Tipo de Seguro</Label>
                                <Select value={medicalFormData.insuranceType} onValueChange={v => setMedicalData({...medicalFormData, insuranceType: v as InsuranceType})}>
                                    <SelectTrigger><SelectValue placeholder="Elegir..." /></SelectTrigger>
                                    <SelectContent>{insuranceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-red-600">Alergias Conocidas (Separe por comas)</Label>
                            <Input placeholder="Ej: Penicilina, AINES, Mariscos..." value={medicalFormData.allergies.join(', ')} onChange={e => setMedicalData({...medicalFormData, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Enfermedades Crónicas</Label>
                            <Input value={medicalFormData.chronicDiseases} onChange={e => setMedicalData({...medicalFormData, chronicDiseases: e.target.value})} placeholder="Ej: Asma, Diabetes tipo 2..." />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contacto de Emergencia</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Nombre" value={medicalFormData.emergencyContactName} onChange={e => setMedicalData({...medicalFormData, emergencyContactName: e.target.value})} />
                                <Input placeholder="Teléfono" value={medicalFormData.emergencyContactPhone} onChange={e => setMedicalData({...medicalFormData, emergencyContactPhone: e.target.value})} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="font-bold">CANCELAR</Button>
                        <Button onClick={handleSaveMedicalInfo} disabled={isSubmitting} className="font-black">
                             {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                             GUARDAR FICHA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper to calculate relative time
function formatDistanceToNow(date: Date, options: { addSuffix: boolean, locale: any }) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'hace unos segundos';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    return format(date, "dd MMM", { locale: es });
}
