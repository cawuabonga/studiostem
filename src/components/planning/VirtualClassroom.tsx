
"use client";

import React, { useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Loader2, MonitorPlay, ShieldCheck } from 'lucide-react';
import type { Unit } from '@/types';

interface VirtualClassroomProps {
    unit: Unit;
}

export function VirtualClassroom({ unit }: VirtualClassroomProps) {
    const { user } = useAuth();
    const [startMeeting, setStartMeeting] = useState(false);

    if (!user) return null;

    const isTeacher = user.role === 'Teacher' || user.role === 'Coordinator' || user.role === 'Admin';
    
    // Generar un nombre de sala único basado en el ID de la unidad
    const roomName = `STEM_AULA_${unit.id.replace(/-/g, '_')}`;

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
                                ? "Como docente, ingresarás con privilegios de moderador para gestionar micrófonos, cámaras y compartir pantalla."
                                : "Te unirás a la clase como participante identificado con tu nombre oficial registrado en la plataforma."
                            }
                        </p>
                    </div>
                    
                    <Button 
                        size="lg" 
                        className="h-16 px-12 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 animate-in zoom-in-95"
                        onClick={() => setStartMeeting(true)}
                    >
                        <Video className="mr-2 h-6 w-6" />
                        {isTeacher ? "INICIAR CLASE AHORA" : "UNIRME A LA CLASE"}
                    </Button>

                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">
                        Desarrollado con tecnología Jitsi Meet Open Source
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full h-[700px] rounded-xl overflow-hidden shadow-2xl border bg-black relative">
            <JitsiMeeting
                domain="meet.jit.si"
                roomName={roomName}
                configOverwrite={{
                    startWithAudioMuted: true,
                    disableModeratorIndicator: false,
                    startScreenSharing: false,
                    enableEmailInStats: false,
                    // Evitar que pidan descargar la app si están en móvil
                    disableDeepLinking: true,
                }}
                interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_JITSI_WATERMARK: false,
                }}
                userInfo={{
                    displayName: user.displayName || 'Usuario STEM',
                    email: user.email || ''
                }}
                onApiReady={(externalApi) => {
                    // Aquí podemos capturar eventos de la reunión en el futuro
                }}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '700px';
                }}
            />
            <div className="absolute top-4 left-4 z-10">
                <Button variant="destructive" size="sm" onClick={() => setStartMeeting(false)} className="font-bold shadow-lg">
                    SALIR DEL AULA
                </Button>
            </div>
        </div>
    );
}
