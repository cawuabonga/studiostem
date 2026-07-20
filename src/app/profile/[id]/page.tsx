
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getInstitutes, getStaffProfileByDocumentId, getStudentProfile, getUnits, getAssignments, getPrograms, getEFSRTAssignmentsForStudent, getMatriculationsForStudent } from '@/config/firebase';
import type { StaffProfile, StudentProfile, Unit, Program, EFSRTAssignment, Matriculation } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, BookOpen, Briefcase, GraduationCap, Share2, Mail, MapPin, Globe, Linkedin, Github, CheckCircle2, Award, Calendar, ExternalLink, Printer, Star, UserCircle, Phone, Facebook, Instagram, Download, FileText, HeartPulse, Droplet, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ProfileData {
    type: 'staff' | 'student';
    profile: StaffProfile | StudentProfile;
    instituteName: string;
    program: Program | null;
    assignedUnits?: Unit[];
    efsrt?: EFSRTAssignment[];
    history?: Matriculation[];
}

const VerifiedBadge = () => (
    <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-in fade-in zoom-in duration-500">
        <CheckCircle2 className="h-3.5 w-3.5" /> Perfil Verificado
    </div>
);

const SectionTitle = ({ children, icon: Icon }: { children: string, icon: any }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex-1 pb-1 border-b border-primary/5">{children}</h3>
    </div>
);

const SocialIcon = ({ href, icon: Icon }: { href?: string, icon: any }) => {
    if (!href) return null;
    return (
        <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-all duration-300"
        >
            <Icon className="h-5 w-5" />
        </a>
    )
}

export default function PublicProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const pathname = usePathname();
  const { setInstitute, institute } = useAuth();
  
  const id = pathname.split('/').pop();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        toast({ title: "¡Enlace copiado!", description: "El portafolio profesional está listo para compartir." });
    });
  };

  const handlePrint = () => window.print();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        setError("No se ha especificado un perfil.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const institutes = await getInstitutes();
        let foundProfile: ProfileData | null = null;

        for (const inst of institutes) {
          const staff = await getStaffProfileByDocumentId(inst.id, id);
          if (staff) {
            const [progs, units, ass] = await Promise.all([
                getPrograms(inst.id),
                getUnits(inst.id),
                getAssignments(inst.id, new Date().getFullYear().toString(), staff.programId)
            ]);
            const program = progs.find(p => p.id === staff.programId) || null;
            const assignedUnits = units.filter(u => ass['MAR-JUL']?.[u.id] === id || ass['AGO-DIC']?.[u.id] === id);

            foundProfile = { type: 'staff', profile: staff, instituteName: inst.name, program, assignedUnits };
            await setInstitute(inst.id);
            break;
          }

          const student = await getStudentProfile(inst.id, id);
          if (student) {
            const [progs, efsrt, history] = await Promise.all([
                getPrograms(inst.id),
                getEFSRTAssignmentsForStudent(inst.id, id),
                getMatriculationsForStudent(inst.id, id)
            ]);
            foundProfile = { 
                type: 'student', 
                profile: student, 
                instituteName: inst.name, 
                program: progs.find(p => p.id === student.programId) || null,
                efsrt: efsrt.filter(e => e.status === 'Aprobado' || e.status === 'En Curso'),
                history
            };
            await setInstitute(inst.id);
            break;
          }
        }

        if (foundProfile) setProfileData(foundProfile);
        else setError("Perfil no encontrado.");
      } catch (err) {
        setError("Ocurrió un error al cargar el perfil.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, setInstitute]);

  if (loading) return (
      <div className="max-w-7xl mx-auto p-8 space-y-8">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <div className="grid md:grid-cols-12 gap-8">
              <div className="md:col-span-4 space-y-6"><Skeleton className="h-96 w-full rounded-2xl" /></div>
              <div className="md:col-span-8 space-y-6"><Skeleton className="h-20 w-full rounded-2xl" /><Skeleton className="h-96 w-full rounded-2xl" /></div>
          </div>
      </div>
  );

  if (error || !profileData) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <UserCircle className="h-16 w-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">{error || "Perfil no disponible"}</h1>
        <p className="text-slate-500 mt-2">No se pudo encontrar el portafolio solicitado.</p>
        <Button className="mt-6" asChild><a href="/">Volver al inicio</a></Button>
    </div>
  );
  
  const { profile, type, instituteName, program, assignedUnits, efsrt, history } = profileData;
  const displayName = 'displayName' in profile ? profile.displayName : profile.fullName;
  const photoURL = profile.photoURL || `https://placehold.co/400x400.png?text=${displayName[0]}`;
  const bannerURL = profile.coverImageUrl || 'https://picsum.photos/seed/tech/1200/400';
  const cvUrl = (profile as StudentProfile).cvUrl;
  const medicalInfo = profile.medicalInfo;

  return (
    <div className="min-h-screen bg-slate-50/50 print:bg-white pb-20 selection:bg-primary/10">
        <style jsx global>{`
            @media print {
                @page { margin: 10mm; size: A4; }
                .no-print { display: none !important; }
                body { background: white !important; }
                .dashboard-container { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
                .card-widget { border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
            }
        `}</style>

        {/* Floating Action Bar */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b no-print">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className="font-black text-sm uppercase tracking-tighter text-slate-900">STEM PORTFOLIO</span>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" size="sm" onClick={handlePrint} className="font-bold">
                        <Printer className="mr-2 h-4 w-4" /> Imprimir CV
                    </Button>
                    <Button size="sm" onClick={handleCopyLink} className="font-bold shadow-lg shadow-primary/10">
                        <Share2 className="mr-2 h-4 w-4" /> Compartir
                    </Button>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 space-y-8 dashboard-container">
            
            {/* --- TOP HERO SECTION --- */}
            <Card className="overflow-hidden border-none shadow-2xl rounded-3xl relative card-widget group">
                {/* Banner superior editable */}
                <div className="h-48 md:h-64 w-full bg-slate-900 relative">
                    <Image 
                        src={bannerURL} 
                        alt="Background" 
                        fill 
                        className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* Sección de Identidad - Toma el color primario del instituto */}
                <div className="px-8 pb-8 flex flex-col md:flex-row items-end gap-6 -mt-16 md:-mt-20 relative z-10 bg-primary text-primary-foreground pt-4">
                    <Avatar className="w-32 h-32 md:w-48 md:h-48 border-8 border-primary shadow-2xl rounded-full">
                        <AvatarImage src={photoURL} className="object-cover" />
                        <AvatarFallback className="text-6xl font-black bg-primary-foreground text-primary">{displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 pb-4 space-y-2 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase drop-shadow-md">{displayName}</h1>
                                <h2 className="text-lg md:text-xl font-bold text-primary-foreground/80 flex items-center justify-center md:justify-start gap-2 mt-1">
                                    {type === 'student' ? 'Estudiante en formación' : profile.role} — <span className="opacity-70">{program?.name || 'Cargando...'}</span>
                                </h2>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                                {institute?.logoUrl && (
                                    <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20">
                                        <Image src={institute.logoUrl} alt="Logo" width={48} height={48} className="object-contain" />
                                    </div>
                                )}
                                <VerifiedBadge />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- SIDEBAR COLUMN --- */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* CV Download Button */}
                    {cvUrl && (
                        <Button className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest shadow-xl shadow-green-600/20 group transition-all no-print" asChild>
                            <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-3 h-6 w-6 group-hover:bounce" />
                                Descargar CV (PDF)
                            </a>
                        </Button>
                    )}

                    {/* Ficha Médica Preventiva (Public) */}
                    {medicalInfo && (medicalInfo.bloodType || (medicalInfo.allergies && medicalInfo.allergies.length > 0)) && (
                        <Card className="rounded-3xl border-none shadow-lg card-widget bg-red-50/30 border border-red-100/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 flex items-center gap-2">
                                    <HeartPulse className="h-4 w-4" /> Salud y Emergencia
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {medicalInfo.bloodType && (
                                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-red-100 shadow-sm">
                                        <div className="p-2.5 bg-red-50 rounded-xl text-red-600"><Droplet className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Grupo Sanguíneo</p>
                                            <p className="text-sm font-black text-red-700">{medicalInfo.bloodType}</p>
                                        </div>
                                    </div>
                                )}
                                {medicalInfo.allergies && medicalInfo.allergies.length > 0 && (
                                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-amber-100 shadow-sm">
                                        <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><AlertCircle className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">Alergias Conocidas</p>
                                            <p className="text-xs font-bold text-amber-700 leading-tight">
                                                {medicalInfo.allergies.join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <p className="text-[8px] text-center text-red-400/80 font-bold uppercase leading-tight italic">
                                    Información preventia para primeros auxilios institucionales.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Contact & Identity Card */}
                    <Card className="rounded-3xl border-none shadow-lg card-widget">
                        <CardHeader>
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Canales de Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="p-2.5 bg-white shadow-sm rounded-xl text-primary"><Mail className="h-5 w-5" /></div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email Oficial</p>
                                    <p className="text-sm font-bold truncate text-slate-700">{profile.email}</p>
                                </div>
                            </div>
                            {profile.phone && (
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="p-2.5 bg-white shadow-sm rounded-xl text-green-600"><Phone className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Teléfono</p>
                                        <p className="text-sm font-bold text-slate-700">{profile.phone}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="p-2.5 bg-white shadow-sm rounded-xl text-blue-600"><Building className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Institución</p>
                                    <p className="text-sm font-bold text-slate-700">{instituteName}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Social & Web Card */}
                    <Card className="rounded-3xl border-none shadow-lg card-widget">
                        <CardHeader>
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Presencia Digital</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            <SocialIcon href={profile.socialLinks?.linkedin} icon={Linkedin} />
                            <SocialIcon href={profile.socialLinks?.github} icon={Github} />
                            <SocialIcon href={profile.socialLinks?.facebook} icon={Facebook} />
                            <SocialIcon href={profile.socialLinks?.instagram} icon={Instagram} />
                            <SocialIcon href={profile.socialLinks?.web} icon={Globe} />
                            {(!profile.socialLinks || Object.values(profile.socialLinks).every(v => !v)) && (
                                <p className="text-xs italic text-slate-400">No se han vinculado redes sociales.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Skills Card */}
                    {profile.skills && profile.skills.length > 0 && (
                        <Card className="rounded-3xl border-none shadow-lg card-widget">
                            <CardHeader>
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Competencias Técnicas</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {profile.skills.map(skill => (
                                    <Badge key={skill} variant="secondary" className="bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-600 border-none px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase transition-all duration-300">
                                        {skill}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* --- MAIN CONTENT COLUMN --- */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Bio / About Card */}
                    <Card className="rounded-3xl border-none shadow-lg card-widget overflow-hidden">
                        <div className="p-8">
                            <SectionTitle icon={UserCircle}>Perfil Profesional</SectionTitle>
                            <p className="text-slate-600 leading-relaxed text-lg italic font-medium">
                                "{profile.bio || "Este profesional cuenta con el aval oficial de su institución educativa, certificando que su formación y desempeño cumplen con los estándares académicos del sistema modular STEM."}"
                            </p>
                        </div>
                    </Card>

                    {/* EFSRT / Work Experience (Students Only) */}
                    {type === 'student' && (
                        <Card className="rounded-3xl border-none shadow-lg card-widget p-8">
                            <SectionTitle icon={Briefcase}>Experiencia en Situaciones Reales de Trabajo (EFSRT)</SectionTitle>
                            <div className="space-y-8">
                                {efsrt && efsrt.length > 0 ? efsrt.map(item => (
                                    <div key={item.id} className="relative pl-10 border-l-2 border-primary/10 pb-2">
                                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-4 border-primary shadow-sm" />
                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                                            <h4 className="font-black text-lg uppercase text-slate-800 leading-none">{item.location}</h4>
                                            <Badge variant="outline" className="font-black text-[9px] uppercase tracking-tighter py-1">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {format(item.startDate.toDate(), "MMM yyyy", { locale: es })} — {format(item.endDate.toDate(), "MMM yyyy", { locale: es })}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-black text-primary mb-3 uppercase tracking-widest">{item.moduleName}</p>
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-500 leading-relaxed italic">
                                            {item.observations || "Actividades formativas supervisadas y validadas por el instituto, demostrando dominio de las capacidades técnicas del módulo."}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 opacity-30">
                                        <Briefcase className="h-12 w-12 mx-auto mb-4" />
                                        <p className="font-bold uppercase text-xs">Sin registros de prácticas oficiales aún.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Mastery of Modules (Students Only) */}
                    {type === 'student' && program && (
                        <Card className="rounded-3xl border-none shadow-lg card-widget p-8">
                            <SectionTitle icon={Award}>Dominio de Módulos Profesionales</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {program.modules.map(mod => {
                                    const isApproved = history?.some(m => m.moduleId === mod.code && m.status === 'aprobado');
                                    return (
                                        <div key={mod.code} className={cn(
                                            "flex flex-col p-5 rounded-2xl border-2 transition-all duration-300",
                                            isApproved 
                                                ? "bg-primary/5 border-primary/10 shadow-sm" 
                                                : "bg-slate-50 border-slate-100 opacity-60 grayscale"
                                        )}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={cn("p-2 rounded-xl", isApproved ? "bg-primary text-white" : "bg-slate-200 text-slate-400")}>
                                                    <Star className="h-5 w-5" />
                                                </div>
                                                {isApproved && <Badge className="bg-green-600 text-white font-black text-[8px] px-3 uppercase">Certificado</Badge>}
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{mod.code}</p>
                                            <h4 className="font-black text-sm uppercase text-slate-800 leading-tight">{mod.name}</h4>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>
                    )}

                    {/* Units at Charge (Staff Only) */}
                    {type === 'staff' && assignedUnits && assignedUnits.length > 0 && (
                        <Card className="rounded-3xl border-none shadow-lg card-widget p-8">
                             <SectionTitle icon={BookOpen}>Especialización Académica (Unidades Dictadas)</SectionTitle>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 {assignedUnits.map(unit => (
                                     <div key={unit.id} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all group">
                                         <p className="text-[10px] font-black text-primary uppercase mb-2 tracking-tighter">Ciclo {unit.semester}° Semestre</p>
                                         <h4 className="font-black text-sm uppercase text-slate-800 leading-tight group-hover:text-primary transition-colors">{unit.name}</h4>
                                         <div className="mt-4 flex items-center gap-2">
                                             <Badge variant="secondary" className="text-[8px] font-black uppercase">{unit.code}</Badge>
                                             <Badge variant="outline" className="text-[8px] font-black uppercase">{unit.turno}</Badge>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </Card>
                    )}
                </div>
            </div>
            
            <footer className="pt-12 pb-8 text-center no-print">
                <div className="flex flex-col items-center gap-2 opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Validez Digital Verificada • STEM V2</p>
                    <p className="text-[9px] font-bold">Generado el {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
            </footer>
        </div>
    </div>
  );
}
