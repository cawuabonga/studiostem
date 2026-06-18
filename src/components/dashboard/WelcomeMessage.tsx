"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { EditProfileDialog } from '../profile/EditProfileDialog';
import { useState } from 'react';
import { LinkProfileDialog } from '../profile/LinkProfileDialog';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { 
    Github, 
    Linkedin, 
    Facebook, 
    Instagram, 
    Globe, 
    Mail, 
    Smartphone, 
    Fingerprint, 
    MapPin, 
    GraduationCap, 
    CalendarCheck, 
    ExternalLink, 
    UserCircle,
    UserCheck,
    Briefcase,
    Pencil,
    FileWarning,
    FileCheck
} from 'lucide-react';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

const SocialButton = ({ href, icon: Icon, color }: { href?: string, icon: any, color: string }) => {
    if (!href) return null;
    return (
        <Button variant="outline" size="icon" className={`h-8 w-8 rounded-full border-muted hover:${color} transition-all`} asChild>
            <a href={href} target="_blank" rel="noopener noreferrer">
                <Icon className="h-4 w-4" />
            </a>
        </Button>
    )
}

const InfoRow = ({ icon: Icon, label, value, color = "text-primary" }: { icon: any, label: string, value?: string, color?: string }) => (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className={`p-2 rounded-md bg-muted ${color}`}>
            <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{label}</p>
            <p className="text-sm font-bold truncate">{value || 'No especificado'}</p>
        </div>
    </div>
)

export default function WelcomeMessage() {
  const { user, reloadUser, institute } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinkProfileOpen, setIsLinkProfileOpen] = useState(false);

  if (!user) return null;
  
  const isUnlinked = !user.documentId && user.role === 'Student';
  const displayName = user.displayName || 'Usuario';
  const roleName = user.roleName || (user.role === 'Student' ? 'Estudiante' : user.role);

  const handleProfileLinked = async () => {
    await reloadUser();
    setIsLinkProfileOpen(false);
  }

  const isStudentOrGraduate = user.role === 'Student' || user.role === 'Graduate';
  const hasCV = !!user.cvUrl;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* SECCIÓN UNLINKED: Alerta para vincular perfil */}
      {isUnlinked && (
        <Card className="border-accent bg-accent/5 border-2 shadow-lg">
            <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
                <div className="bg-accent/20 p-4 rounded-full">
                    <UserCircle className="h-12 w-12 text-accent-foreground" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-black uppercase tracking-tighter">Vincule su Cuenta</h3>
                    <p className="text-muted-foreground text-sm">Para acceder a sus notas, unidades didácticas y trámites, necesitamos conectar su usuario con su perfil oficial en el instituto.</p>
                </div>
                <Button onClick={() => setIsLinkProfileOpen(true)} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/80 font-black px-8">
                    VINCULAR AHORA
                </Button>
            </CardContent>
        </Card>
      )}

      {/* ALERTA DE CV FALTANTE PARA ESTUDIANTES/EGRESADOS */}
      {isStudentOrGraduate && !hasCV && !isUnlinked && (
        <div className="p-4 bg-primary/10 border-2 border-dashed border-primary/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white rounded-xl text-primary shadow-sm">
                    <FileWarning className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="font-black text-sm uppercase text-primary">Currículum Vitae Pendiente</h4>
                    <p className="text-xs font-medium text-slate-600">Sube tu CV en PDF para activar tu perfil en la Bolsa Laboral y postular a vacantes.</p>
                </div>
            </div>
            <Button onClick={() => setIsEditOpen(true)} size="sm" className="font-bold rounded-xl px-6 h-10 shadow-lg">
                SUBIR CV AHORA
            </Button>
        </div>
      )}

      {/* DASHBOARD PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Perfil e Identidad */}
        <div className="lg:col-span-4 space-y-6">
            <Card className="overflow-hidden border-primary/10 shadow-xl">
                <div className="h-24 w-full bg-primary relative">
                     <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/pattern/400/100')] bg-cover" />
                </div>
                <div className="px-6 pb-6 text-center">
                    <div className="relative -mt-12 mb-4 inline-block">
                        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                            <AvatarImage src={user.photoURL || `https://placehold.co/100x100.png?text=${displayName[0]}`} alt={displayName} />
                            <AvatarFallback className="text-2xl font-black">{displayName[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-1 right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-background" title="En línea" />
                    </div>
                    
                    <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">{displayName}</h2>
                    <p className="text-xs font-bold text-primary mt-1 uppercase tracking-widest">{roleName}</p>
                    
                    <div className="mt-4 flex justify-center gap-2">
                        <SocialButton href={user.socialLinks?.linkedin} icon={Linkedin} color="text-blue-600" />
                        <SocialButton href={user.socialLinks?.github} icon={Github} color="text-black" />
                        <SocialButton href={user.socialLinks?.facebook} icon={Facebook} color="text-blue-800" />
                        <SocialButton href={user.socialLinks?.instagram} icon={Instagram} color="text-pink-600" />
                        <SocialButton href={user.socialLinks?.web} icon={Globe} color="text-primary" />
                    </div>

                    <Separator className="my-6" />

                    <div className="text-left space-y-1">
                        <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Sobre mí</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                            {user.bio || "No has añadido una biografía todavía. Cuéntanos quién eres."}
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                        <Button className="w-full font-bold" onClick={() => setIsEditOpen(true)}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar mi Perfil
                        </Button>
                        {user.documentId && (
                            <Button variant="outline" className="w-full font-bold" asChild>
                                <Link href={`/profile/${user.documentId}`} target="_blank">
                                    <ExternalLink className="h-4 w-4 mr-2" /> Perfil Público
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>

        {/* Columna Derecha: Detalles e Información */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* Ficha de Información Personal */}
            <Card className="shadow-lg border-primary/5">
                <CardHeader className="pb-2 border-b mb-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <UserCheck className="h-4 w-4" /> Datos de Identidad y Contacto
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow icon={Fingerprint} label="Documento de Identidad" value={user.documentId} />
                    <InfoRow icon={Mail} label="Correo Institucional" value={user.email || ''} />
                    <InfoRow icon={Smartphone} label="Celular / WhatsApp" value={(user as any).phone} color="text-green-600" />
                    <InfoRow icon={MapPin} label="Dirección de Residencia" value={(user as any).address} color="text-red-500" />
                </CardContent>
            </Card>

            {/* Ficha Institucional */}
            {!isUnlinked && (
                <Card className="shadow-lg border-primary/5 bg-primary/5">
                    <CardHeader className="pb-2 border-b border-primary/10 mb-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Situación Académica
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-primary p-3 rounded-lg text-primary-foreground">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Programa de Estudios</p>
                                    <p className="text-base font-bold leading-tight">{user.programName || 'No asignado'}</p>
                                    <Badge variant="outline" className="mt-1 bg-white">ID: {user.programId}</Badge>
                                </div>
                            </div>
                            {isStudentOrGraduate && (
                                <div className={cn(
                                    "p-3 rounded-xl flex items-center gap-3 border transition-all",
                                    hasCV ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"
                                )}>
                                    {hasCV ? <FileCheck className="h-5 w-5" /> : <FileWarning className="h-5 w-5" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        CV DIGITAL: {hasCV ? "VINCULADO" : "PENDIENTE"}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-background rounded-xl border shadow-sm text-center">
                                <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Semestre</p>
                                <p className="text-2xl font-black text-primary">{user.currentSemester || '-'}</p>
                            </div>
                            <div className="p-4 bg-background rounded-xl border shadow-sm text-center">
                                <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Turno</p>
                                <p className="text-2xl font-black text-primary">{user.turno || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Footer con Info del Instituto */}
            <div className="flex items-center gap-2 px-2">
                 <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Miembro de {institute?.name || 'STEM Platform'} desde {(user as any).admissionYear || 'recientemente'}
                 </p>
            </div>
        </div>
      </div>

      <EditProfileDialog user={user} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
      <LinkProfileDialog isOpen={isLinkProfileOpen} onClose={() => setIsLinkProfileOpen(false)} onProfileLinked={handleProfileLinked} />
    </div>
  );
}