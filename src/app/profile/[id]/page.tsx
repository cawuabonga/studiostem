
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getInstitutes, getStaffProfileByDocumentId, getStudentProfile, getUnits, getAssignments, getPrograms, getEFSRTAssignmentsForStudent, getMatriculationsForStudent } from '@/config/firebase';
import type { StaffProfile, StudentProfile, Unit, Program, EFSRTAssignment, Matriculation } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, BookOpen, Briefcase, GraduationCap, Share2, Mail, MapPin, Globe, Linkedin, Github, CheckCircle2, Award, Calendar, ExternalLink, Printer, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
    <div className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
        <CheckCircle2 className="h-3 w-3" /> Perfil Verificado
    </div>
);

const SectionTitle = ({ children, icon: Icon }: { children: string, icon: any }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/5 rounded-lg text-primary">
            <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary border-b-2 border-primary/10 flex-1 pb-1">{children}</h3>
    </div>
);

export default function PublicProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const pathname = usePathname();
  const { setInstitute } = useAuth();
  
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

        for (const institute of institutes) {
          const staff = await getStaffProfileByDocumentId(institute.id, id);
          if (staff) {
            const [progs, units, ass] = await Promise.all([
                getPrograms(institute.id),
                getUnits(institute.id),
                getAssignments(institute.id, new Date().getFullYear().toString(), staff.programId)
            ]);
            const program = progs.find(p => p.id === staff.programId) || null;
            const assignedUnits = units.filter(u => ass['MAR-JUL']?.[u.id] === id || ass['AGO-DIC']?.[u.id] === id);

            foundProfile = { type: 'staff', profile: staff, instituteName: institute.name, program, assignedUnits };
            await setInstitute(institute.id);
            break;
          }

          const student = await getStudentProfile(institute.id, id);
          if (student) {
            const [progs, efsrt, history] = await Promise.all([
                getPrograms(institute.id),
                getEFSRTAssignmentsForStudent(institute.id, id),
                getMatriculationsForStudent(institute.id, id)
            ]);
            foundProfile = { 
                type: 'student', 
                profile: student, 
                instituteName: institute.name, 
                program: progs.find(p => p.id === student.programId) || null,
                efsrt: efsrt.filter(e => e.status === 'Aprobado' || e.status === 'En Curso'),
                history
            };
            await setInstitute(institute.id);
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
      <div className="max-w-5xl mx-auto p-8 grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-40 w-full" /></div>
          <div className="md:col-span-8 space-y-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>
      </div>
  );
  if (error || !profileData) return <div className="text-center p-20 font-bold text-destructive">{error || "Perfil no disponible"}</div>;
  
  const { profile, type, instituteName, program, assignedUnits, efsrt, history } = profileData;
  const displayName = 'displayName' in profile ? profile.displayName : profile.fullName;
  const photoURL = profile.photoURL || `https://placehold.co/200x200.png?text=${displayName[0]}`;

  return (
    <div className="min-h-screen bg-slate-50/50 print:bg-white pb-20">
        <style jsx global>{`
            @media print {
                @page { margin: 15mm; size: A4; }
                .no-print { display: none !important; }
                body { background: white !important; }
                .cv-container { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
            }
        `}</style>

        {/* Barra de Acciones Superior */}
        <div className="max-w-5xl mx-auto pt-6 px-4 flex justify-end gap-3 no-print">
            <Button variant="outline" size="sm" onClick={handlePrint} className="font-bold border-2">
                <Printer className="mr-2 h-4 w-4" /> Imprimir CV
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="font-bold border-2">
                <Share2 className="mr-2 h-4 w-4" /> Compartir Portafolio
            </Button>
        </div>

        <div className="max-w-5xl mx-auto mt-6 bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200 cv-container">
            <div className="grid md:grid-cols-12 min-h-[900px]">
                
                {/* COLUMNA LATERAL (Sidebar) */}
                <aside className="md:col-span-4 bg-slate-900 text-white p-8 space-y-10">
                    <div className="text-center space-y-4">
                        <Avatar className="w-40 h-40 mx-auto border-4 border-white/10 shadow-2xl">
                            <AvatarImage src={photoURL} className="object-cover" />
                            <AvatarFallback className="text-5xl font-black bg-primary">{displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="pt-2">
                            <VerifiedBadge />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/10 pb-2">Contacto</h3>
                        <ul className="space-y-4 text-xs font-medium text-slate-300">
                            <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> {profile.email}</li>
                            {profile.phone && <li className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-primary" /> {profile.phone}</li>}
                            <li className="flex items-center gap-3"><Building className="h-4 w-4 text-primary" /> {instituteName}</li>
                        </ul>
                    </div>

                    {profile.socialLinks && (
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/10 pb-2">Redes y Portafolio</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {profile.socialLinks.linkedin && (
                                    <Button variant="ghost" size="sm" className="bg-white/5 hover:bg-white/10 text-white justify-start h-8 text-[10px] font-bold" asChild>
                                        <a href={profile.socialLinks.linkedin} target="_blank"><Linkedin className="mr-2 h-3.5 w-3.5" /> LinkedIn</a>
                                    </Button>
                                )}
                                {profile.socialLinks.github && (
                                    <Button variant="ghost" size="sm" className="bg-white/5 hover:bg-white/10 text-white justify-start h-8 text-[10px] font-bold" asChild>
                                        <a href={profile.socialLinks.github} target="_blank"><Github className="mr-2 h-3.5 w-3.5" /> GitHub</a>
                                    </Button>
                                )}
                                {profile.socialLinks.web && (
                                    <Button variant="ghost" size="sm" className="bg-white/5 hover:bg-white/10 text-white justify-start h-8 text-[10px] font-bold" asChild>
                                        <a href={profile.socialLinks.web} target="_blank"><Globe className="mr-2 h-3.5 w-3.5" /> Web</a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {profile.skills && profile.skills.length > 0 && (
                        <div className="space-y-6">
                             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/10 pb-2">Competencias</h3>
                             <div className="flex flex-wrap gap-2">
                                 {profile.skills.map(skill => (
                                     <Badge key={skill} variant="outline" className="bg-white/5 border-white/10 text-white font-bold text-[9px] uppercase tracking-tight py-1 px-2">
                                         {skill}
                                     </Badge>
                                 ))}
                             </div>
                        </div>
                    )}

                    <div className="pt-10 opacity-30 text-[8px] font-black uppercase tracking-widest text-center">
                        STEM Platform • 2024
                    </div>
                </aside>

                {/* COLUMNA PRINCIPAL (Contenido) */}
                <main className="md:col-span-8 p-12 space-y-12">
                    {/* Header Principal */}
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">{displayName}</h1>
                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                            <GraduationCap className="h-6 w-6" />
                            {type === 'student' ? 'Estudiante' : profile.role} en {program?.name || 'Cargando...'}
                        </h2>
                    </div>

                    {/* Resumen Profesional */}
                    <div className="space-y-4">
                        <SectionTitle icon={UserCircle}>Perfil Profesional</SectionTitle>
                        <p className="text-slate-600 leading-relaxed text-justify italic">
                            {profile.bio || "Este perfil cuenta con la verificación oficial del instituto, garantizando la autenticidad de su trayectoria académica y competencias desarrolladas."}
                        </p>
                    </div>

                    {/* Experiencia (EFSRT para Alumnos) */}
                    {type === 'student' && (
                        <div className="space-y-6">
                            <SectionTitle icon={Briefcase}>Experiencia en Situaciones Reales de Trabajo (EFSRT)</SectionTitle>
                            <div className="space-y-6">
                                {efsrt && efsrt.length > 0 ? efsrt.map(item => (
                                    <div key={item.id} className="relative pl-8 border-l-2 border-slate-100 py-1">
                                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-black text-sm uppercase text-slate-800">{item.location}</h4>
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded uppercase tracking-tighter">
                                                {format(item.startDate.toDate(), "MMM yyyy", { locale: es })} - {format(item.endDate.toDate(), "MMM yyyy", { locale: es })}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-primary mb-2 uppercase">{item.moduleName}</p>
                                        <p className="text-xs text-slate-500 leading-relaxed">{item.observations || "Desempeño verificado en el área correspondiente según el plan modular."}</p>
                                    </div>
                                )) : (
                                    <p className="text-xs italic text-slate-400">Prácticas pre-profesionales en curso como parte del plan de estudios.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trayectoria Académica (Módulos para Alumnos) */}
                    {type === 'student' && program && (
                        <div className="space-y-6">
                            <SectionTitle icon={Award}>Dominio de Módulos Profesionales</SectionTitle>
                            <div className="grid gap-4">
                                {program.modules.map(mod => {
                                    const isApproved = history?.some(m => m.moduleId === mod.code && m.status === 'aprobado');
                                    return (
                                        <div key={mod.code} className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                                            isApproved ? "bg-green-50/30 border-green-100" : "bg-slate-50/50 border-slate-100 grayscale opacity-60"
                                        )}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-2 rounded-lg", isApproved ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-400")}>
                                                    <Star className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{mod.code}</p>
                                                    <h4 className="font-black text-sm uppercase text-slate-800">{mod.name}</h4>
                                                </div>
                                            </div>
                                            {isApproved && <Badge className="bg-green-600 text-white font-black text-[9px] px-3 uppercase tracking-tighter">Certificado</Badge>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Unidades a Cargo (Para Docentes) */}
                    {type === 'staff' && assignedUnits && assignedUnits.length > 0 && (
                        <div className="space-y-6">
                             <SectionTitle icon={BookOpen}>Especialización Académica (Unidades Dictadas)</SectionTitle>
                             <div className="grid grid-cols-2 gap-4">
                                 {assignedUnits.map(unit => (
                                     <div key={unit.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary/20 transition-all group">
                                         <p className="text-[10px] font-black text-primary uppercase mb-1 tracking-tighter">Ciclo {unit.semester}°</p>
                                         <h4 className="font-bold text-sm uppercase text-slate-800 leading-tight group-hover:text-primary transition-colors">{unit.name}</h4>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
        
        {/* Footer de Validez */}
        <div className="max-w-5xl mx-auto mt-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] no-print">
            Documento de Validez Académica Digital • STEM Platform
        </div>
    </div>
  );
}

const UserCircle = ({ className, ...props }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
);
