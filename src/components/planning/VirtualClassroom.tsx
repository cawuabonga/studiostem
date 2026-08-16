
"use client";

import React, { useState, useEffect } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Video, MonitorPlay, ShieldCheck, ArrowLeft, Info, Lock, Loader2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, setVirtualClassroomStatus } from '@/config/firebase';
import type { Unit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VirtualClassroomProps {
    unit: Unit;
}

export function VirtualClassroom({ unit }: VirtualClassroomProps) {
    const { user, instituteId } = useAuth();
    const { toast } = useToast();
    const [startMeeting, setStartMeeting] = useState(false);
    const [isLive, setIsLive] = useState(unit.isVirtualClassroomActive || false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    if (!user) return null;

    // LÓGICA DE ROLES ROBUSTA: Verifica por roleId que es más estable
    const isTeacher = 
        user.roleId === 'teacher' || 
        user.roleId === 'coordinator' || 
        user.roleId === 'admin' ||
        ['Teacher', 'Coordinator', 'Admin', 'SuperAdmin'].includes(user.role || '');
    
    const APP_ID = "vpaas-magic-cookie-c7c6b1a32df24878a851d88c8e4de4e9";
    const roomName = `STEM_V2_AULA_${unit.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

    useEffect(() => {
        if (!instituteId || !unit.id) return;

        const unitRef = doc(db, 'institutes', instituteId, 'unidadesDidacticas', unit.id);
        const unsubscribe = onSnapshot(unitRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setIsLive(data.isVirtualClassroomActive || false);
            }
        });

        return () => unsubscribe();
    }, [instituteId, unit.id]);

    const handleToggleStatus = async (checked: boolean) => {
        if (!instituteId) return;
        setIsUpdatingStatus(true);
        try {
            await setVirtualClassroomStatus(instituteId, unit.id, checked);
            toast({
                title: checked ? "Aula Virtual Habilitada" : "Aula Virtual Deshabilitada",
                description: checked ? "Los alumnos ya pueden ingresar a la sesión." : "El acceso para alumnos ha sido cerrado.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar el estado del aula.",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (!startMeeting) {
        return (
            <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-background to-primary/5">
                <CardHeader className="text-center pb-8">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <MonitorPlay className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tight">Aula Virtual STEM</CardTitle>
                    <CardDescription className="text-lg">
                        Sesión de videoclase profesional para: <span className="font-bold text-foreground underline">{unit.name}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-8 pb-12">
                    
                    {isTeacher && (
                        <div className="w-full max-w-md p-6 bg-background rounded-xl border-2 border-primary/10 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-black uppercase tracking-tight">Acceso Estudiantil</Label>
                                    <p className="text-xs text-muted-foreground">
                                        {isLive ? "El aula está abierta para todos." : "Solo tú puedes entrar en este momento."}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                    <Switch 
                                        checked={isLive} 
                                        onCheckedChange={handleToggleStatus} 
                                        disabled={isUpdatingStatus}
                                    />
                                </div>
                            </div>
                            <div className={cn(
                                "p-3 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors",
                                isLive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                            )}>
                                {isLive ? <ShieldCheck className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                ESTADO: {isLive ? "SALA PÚBLICA (ABIERTA)" : "SALA PRIVADA (CERRADA)"}
                            </div>
                        </div>
                    )}

                    <div className="max-w-md text-center space-y-4">
                        {!isTeacher && !isLive ? (
                            <div className="p-8 bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
                                <Lock className="h-10 w-10 text-amber-500" />
                                <div className="space-y-1">
                                    <h4 className="font-black text-amber-800 uppercase">Aula No Habilitada</h4>
                                    <p className="text-sm text-amber-700 leading-relaxed">
                                        El docente aún no ha abierto el acceso a la sesión. Por favor, espera a que la clase inicie oficialmente.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 justify-center text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full border border-green-100">
                                    <ShieldCheck className="h-5 w-5" />
                                    Conexión Segura STEM JaaS
                                </div>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    {isTeacher 
                                        ? "Ingresarás con privilegios de moderador. Recuerda habilitar el acceso a los estudiantes antes de comenzar."
                                        : "Te unirás a la clase identificado con tu nombre oficial."
                                    }
                                </p>
                                <Button 
                                    size="lg" 
                                    className="h-16 px-12 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                    onClick={() => setStartMeeting(true)}
                                >
                                    <Video className="mr-2 h-6 w-6" />
                                    {isTeacher ? "INICIAR MI SESIÓN" : "UNIRME A LA CLASE"}
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg max-w-lg flex gap-3 items-start">
                        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-[10px] text-blue-800 leading-tight">
                            <p className="font-bold uppercase mb-1">Nota Técnica:</p>
                            Este servicio utiliza infraestructura privada de 8x8 JaaS vinculada a tu App ID. El control de acceso es gestionado localmente por STEM para garantizar la privacidad académica.
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full h-[750px] rounded-xl overflow-hidden shadow-2xl border bg-black relative animate-in zoom-in-95 duration-500">
            <JitsiMeeting
                domain="8x8.vc"
                roomName={`${APP_ID}/${roomName}`}
                lang="es"
                configOverwrite={{
                    startWithAudioMuted: true,
                    startWithVideoMuted: false,
                    disableModeratorIndicator: false,
                    startScreenSharing: true,
                    enableEmailInStats: false,
                    disableDeepLinking: true,
                    prejoinPageEnabled: false,
                    enableWelcomePage: false,
                    disableInviteFunctions: true,
                    doNotStoreRoom: true,
                    remoteVideoMenu: {
                        disableKick: !isTeacher,
                    },
                    disableRemoteMute: !isTeacher,
                }}
                interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    HIDE_DEEP_LINKING_LOGO: true,
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                        'security'
                    ],
                }}
                userInfo={{
                    displayName: user.displayName || 'Usuario STEM',
                    email: user.email || ''
                }}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '750px';
                }}
            />
            <div className="absolute top-4 left-4 z-50 flex gap-2">
                <Button variant="destructive" size="sm" onClick={() => setStartMeeting(false)} className="font-bold shadow-lg h-8 border-2 border-white/20">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    SALIR DEL AULA
                </Button>
                {isTeacher && (
                    <div className="bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border-2 border-white/20 flex items-center gap-3">
                         <span className="text-[10px] text-white font-black uppercase tracking-widest">Acceso Estudiantes</span>
                         <Switch 
                            checked={isLive} 
                            onCheckedChange={handleToggleStatus} 
                            className="scale-75 data-[state=checked]:bg-green-500"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
