
"use client";

import React, { useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, MonitorPlay, ShieldCheck, ArrowLeft, Info } from 'lucide-react';
import type { Unit } from '@/types';

interface VirtualClassroomProps {
    unit: Unit;
}

export function VirtualClassroom({ unit }: VirtualClassroomProps) {
    const { user } = useAuth();
    const [startMeeting, setStartMeeting] = useState(false);

    if (!user) return null;

    const isTeacher = user.role === 'Teacher' || user.role === 'Coordinator' || user.role === 'Admin' || user.role === 'SuperAdmin';
    
    // Generar un nombre de sala único basado en el ID de la unidad
    const roomName = `STEM_V2_AULA_${unit.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (!startMeeting) {
        return (
            <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-background to-primary/5">
                <CardHeader className="text-center pb-8">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <MonitorPlay className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tight">Aula Virtual STEM</CardTitle>
                    <CardDescription className="text-lg">
                        Sesión de videoclase en vivo para: <span className="font-bold text-foreground underline">{unit.name}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6 pb-12">
                    <div className="max-w-md text-center space-y-4">
                        <div className="flex items-center gap-2 justify-center text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full border border-green-100">
                            <ShieldCheck className="h-5 w-5" />
                            Acceso Seguro Verificado
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                            {isTeacher 
                                ? "Como docente, ingresarás con privilegios de moderador para gestionar la sesión."
                                : "Te unirás a la clase identificado con tu nombre oficial registrado."
                            }
                        </p>
                    </div>
                    
                    <Button 
                        size="lg" 
                        className="h-16 px-12 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                        onClick={() => setStartMeeting(true)}
                    >
                        <Video className="mr-2 h-6 w-6" />
                        {isTeacher ? "INICIAR CLASE AHORA" : "UNIRME A LA CLASE"}
                    </Button>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg max-w-lg flex gap-3 items-start">
                        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-[10px] text-amber-800 leading-tight">
                            <p className="font-bold uppercase mb-1">Nota sobre el servicio gratuito:</p>
                            Jitsi Meet (meet.jit.si) es un servicio externo. Para eliminar el mensaje de "demo" y el límite de 5 minutos en producción, se recomienda conectar con una cuenta de 8x8 JaaS (Jitsi as a Service), que ofrece un nivel gratuito para instituciones educativas.
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full h-[750px] rounded-xl overflow-hidden shadow-2xl border bg-black relative animate-in zoom-in-95 duration-500">
            <JitsiMeeting
                domain="meet.jit.si"
                roomName={roomName}
                lang="es"
                configOverwrite={{
                    startWithAudioMuted: true,
                    startWithVideoMuted: false,
                    disableModeratorIndicator: false,
                    startScreenSharing: true,
                    enableEmailInStats: false,
                    disableDeepLinking: true,
                    prejoinPageEnabled: false, // Salta la pre-sala de Jitsi para evitar bloqueos
                    enableWelcomePage: false,
                    disableInviteFunctions: true, // Desactiva invitar para mayor privacidad
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
            <div className="absolute top-4 left-4 z-50">
                <Button variant="destructive" size="sm" onClick={() => setStartMeeting(false)} className="font-bold shadow-lg h-8 border-2 border-white/20">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    SALIR DEL AULA
                </Button>
            </div>
        </div>
    );
}
