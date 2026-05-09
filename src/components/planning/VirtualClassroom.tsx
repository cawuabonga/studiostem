
"use client";

import React, { useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, MonitorPlay, ShieldCheck, ArrowLeft } from 'lucide-react';
import type { Unit } from '@/types';

interface VirtualClassroomProps {
    unit: Unit;
}

export function VirtualClassroom({ unit }: VirtualClassroomProps) {
    const { user } = useAuth();
    const [startMeeting, setStartMeeting] = useState(false);

    if (!user) return null;

    const isTeacher = user.role === 'Teacher' || user.role === 'Coordinator' || user.role === 'Admin';
    
    // Generar un nombre de sala único y limpio (solo alfanumérico y guiones bajos)
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
                        <p className="text-muted-foreground leading-relaxed">
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

                    <div className="text-[10px] text-muted-foreground text-center space-y-1">
                        <p className="uppercase font-black tracking-widest opacity-50">Tecnología Jitsi Meet Encapsulada</p>
                        <p className="italic">Nota: Asegúrate de permitir el uso de cámara y micro en tu navegador.</p>
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
                configOverwrite={{
                    startWithAudioMuted: true,
                    startWithVideoMuted: false,
                    disableModeratorIndicator: false,
                    startScreenSharing: false,
                    enableEmailInStats: false,
                    disableDeepLinking: true,
                    // Desactivar la pre-sala propia de Jitsi para evitar el bucle de hardware
                    prejoinPageEnabled: false,
                    // Mejorar privacidad
                    remoteVideoMenu: {
                        disableKick: !isTeacher,
                    },
                    disableRemoteMute: !isTeacher,
                }}
                interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
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
